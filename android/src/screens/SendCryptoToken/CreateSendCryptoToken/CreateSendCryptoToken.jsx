import {
    View,
    Text,
    ScrollView,
    TouchableWithoutFeedback,
    TouchableOpacity,
} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView } from 'react-native';
import { Keyboard } from 'react-native';
import { Platform } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { moneyRequestStyle } from '../../RequestMoney/Create/CreateRequest/createRequest.style';
import TransactionStep from '../../components/TransactionStep/TransactionStep';
import { useTranslation } from 'react-i18next';
import CustomButton from '../../components/Buttons/CustomButton/CustomButton';
import CustomInput from '../../components/CustomInput/CustomInput';
import Scan from '../../../assets/svg/scan.svg';
import { rs } from '../../../utils/styles/responsiveSize';
import {
    CONFIRM_SEND_CRYPTO_TOKEN,
    CREATE_SEND_CRYPTO_TOKEN,
    HOME,
    SCAN_QR_CODE,
} from '../../../navigation/routeName/routeName';
import { debounceValidation } from '../../utilities/Validation/Validation';
import { useDispatch, useSelector } from 'react-redux';
import { getAllPreference } from '../../../features/slices/preferenceSlice/preferenceSlice';
import { memo } from 'react';
import config from '../../../../config';
import { getInfo } from '../../../features/auth/login/loginApi';
import { useContext } from 'react';
import { NetworkContext } from '../../../utils/Network/NetworkProvider';
import { handleToaster } from '../../../utils/CustomAlert/handleAlert';

const CreateSendCryptoToken = ({ navigation, route }) => {
    const { isConnected } = useContext(NetworkContext);
    const { t: trans } = useTranslation();
    const data = route?.params?.data || '';
    const { currencyData } = useSelector(state => state.cryptoSendCurrency) || {};
    const { code, id, type, typeID } = currencyData || {};

    const initialState = {
        recipientAddress: '',
        code: code,
        id: id,
        type: type,
        senderAddress: '',
        network: '',
        typeID: typeID,
    };
    const errorState = {
        recipientAddress: false,
        code: false,
    };
    const { colors } = useTheme();
    const styles = moneyRequestStyle(colors);
    const dispatch = useDispatch();
    const count = useRef(8);
    const { user: { token = '' } = {} } = useSelector(
        state => state.loginUserReducer,
    );
    const { preference } = useSelector(state => state.preference) || {};
    const { decimal_format_amount_crypto = '8' } = preference || {};
    const [isFastLoad, setIsFastLoad] = useState(true);
    const [checkAddress, setCheckAddress] = useState(false);
    const [addressError, setAddressError] = useState('');
    const [formData, setFormData] = useState(initialState);
    const [amount, setAmount] = useState('');
    const [minLimit, setMinLimit] = useState('');
    const [error, setError] = useState(errorState);
    const [amountError, setAmountError] = useState('')
    const [amountCheck, setAmountCheck] = useState(false);
    const [networkFee, setNetworkFee] = useState('');
    const [decimalValue, setDecimalValue] = useState('');

    const handleError = () => {
        const { recipientAddress } = formData;
        setError({
            recipientAddress: recipientAddress === '',
            amount: amount === '',
        });
    };

    useEffect(() => {
        const fastLoadTimeout = setTimeout(() => {
            setIsFastLoad(false);
        }, 0);
        return () => {
            clearTimeout(fastLoadTimeout);
        };
    }, []);

    const getAddress = async () => {
        let URL = "";
        if (formData.type == 'crypto_token') {
            URL = `${config.BASE_URL_VERSION}/token/send/tatumio/user-address/${formData?.code}/${formData?.typeID}`;
        }
        const result = await getInfo(token, URL);

        const { records, status } = result?.response || {};
        if (status?.code === 200) {
            setFormData(prevFormData => ({
                ...prevFormData,
                senderAddress: records?.cryptoAddress, network: records?.network, minTatumIoLimit: records?.minTatumIoLimit
            }));
            setMinLimit(records?.minTatumIoLimit)
        } else {
            handleToaster(trans(status?.message), 'error', colors);
        }
    };
    //    valid user balance 
    const networkFree = async ({ address, amount, errorAddress }) => {
        try {
            if (address.length == 0 || errorAddress.length > 0 || !isConnected) return;
            setAmountCheck(true);
            let URL = "";
            if (formData.type == 'crypto_token') {
                URL = `${config.BASE_URL_VERSION}/token/send/tatumio/validate-user-balance?walletCurrencyCode=${formData.code}&walletId=${formData.typeID}&receiverAddress=${address}&amount=${amount}`
            }
            const result = await getInfo(token, URL);
            const { status, records } = result?.response || {};

            if (status?.code === 200) {
                setAmountError('');
                if (formData.type == 'crypto_token') {
                    setNetworkFee(records['networkFee']);
                    setDecimalValue(records['tokenDecimals']);
                } else {
                    setNetworkFee(records['network-fee']);
                }
            } else {
                if (status.message.includes('minimum')) {
                    const parts = status.message.split(' ');
                    const amountValue = parts[parts.length - 2];
                    const currency = parts[parts.length - 1];
                    const errorText = parts.slice(0, parts.length - 2).join(' ');
                    setAmountError(trans(errorText) + amountValue + " " + currency);
                }
                else if (status.message.includes('Minimum')) {
                    const parts = status.message.split(' ');
                    const amountValue = parts[1];
                    const currency = parts[2];
                    const errorTextTemplate = "Minimum {{x}} {{y}} amount needed for network fee.";
                    const errorText = trans(errorTextTemplate, { x: amountValue, y: currency });
                    setAmountError(errorText);
                }
                else {
                    if (status.code === 400) {
                        handleToaster(trans('Your account has been suspended!'), 'error', colors);
                    }
                    else if (status.code === 403) {
                        handleToaster(trans('You are not permitted for this transaction!'), 'error', colors);
                    }
                    else {
                        setAmountError(trans(status?.message));
                    }
                }
            }
        } catch (error) {
            handleToaster(trans(error.message), 'error', colors);
        } finally {
            setAmountCheck(false);
        }
    };
    // crypto token address validation 
    const doMatchAddress = async (value) => {
        try {
            if (!value || !isConnected) return;
            let URL = "";
            if (formData.type == 'crypto_token') {
                URL = `${config.BASE_URL_VERSION}/token/send/tatumio/validate-address?address=${value}&network=${formData?.network}`;
            }
            setCheckAddress(true);
            const result = await getInfo(token, URL);
            if (!result) return;
            const { status } = result?.response || {};
            if (status?.code === 200) {
                networkFree({ address: value, amount, errorAddress: '' });
                setAddressError('')
            } else setAddressError(trans(status?.message))
        } catch (error) {
            handleToaster(trans(error.message), 'error', colors);
        } finally {
            setCheckAddress(false);
        }
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            dispatch(getAllPreference({ token }));
            getAddress();
        });
        return unsubscribe;
    }, [navigation]);

    useEffect(() => {
        if (data) {
            setFormData(prevFormData => ({
                ...prevFormData,
                recipientAddress: data
            }));
            doMatchAddress(data)
        }
    }, [data]);

    useEffect(() => {
        setAmountCheck(true);
        let timeoutId;
        const handler = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                networkFree({ address: formData.recipientAddress, amount: amount, errorAddress: addressError });
            }, 500);
        };
        handler();
        return () => clearTimeout(timeoutId);

    }, [amount]);

    useEffect(() => {
        let timeoutId;
        const handler = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                doMatchAddress(formData.recipientAddress)
            }, 500);
        };
        handler();
        return () => clearTimeout(timeoutId);
    }, [formData.recipientAddress]);

    if (isFastLoad) {
        return <View style={styles.scroll_view} />;
    }

    const handleProceed = () => {
        const { recipientAddress } = formData;
        if (!recipientAddress || !amount || checkAddress || amountCheck || amountError || addressError) {
            handleError();
            return;
        }
        navigation.navigate(CONFIRM_SEND_CRYPTO_TOKEN, { data: { formData, amount, networkFee, setFormData, initialState, setAmount, } });
    };
    const handleQRScan = () => {
        navigation.navigate(SCAN_QR_CODE, {
            method: {
                method: trans('Send Crypto Token'),
                goToScreen: CREATE_SEND_CRYPTO_TOKEN,
            },
        });
    };

    return (
        <>
            <KeyboardAvoidingView
                style={styles.onKeyboard}
                behavior={Platform.OS === 'ios' ? 'padding' : ''}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={styles.scroll_view}
                    keyboardShouldPersistTaps={'always'}>
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={styles.container}>
                            <TransactionStep
                                currentPage={trans('{{x}} of {{y}}', {
                                    x: 1,
                                    y: 2,
                                })}
                                header={trans('Send {{x}}', { x: formData?.code })}
                                presentStep={1}
                                totalStep={2}
                                description={trans('Enter Recipient Address and Amount')}
                                style={styles.transactionStep}
                            />
                            <View style={styles.email}>
                                <CustomInput
                                    label={trans('Recipient Address') + '*'}
                                    placeholder={trans('Recipient Address')}
                                    keyboardAppearance={'dark'}
                                    autoCapitalize={'none'}
                                    value={formData?.recipientAddress}
                                    editable={data && !addressError ? false : true}
                                    rightIcon={
                                        <TouchableOpacity
                                            onPress={handleQRScan}
                                            style={styles.qrButton}
                                        >
                                            <Scan
                                                fill={colors.rightArrow}
                                                height={rs(25)}
                                                width={rs(25)}
                                            />
                                        </TouchableOpacity>
                                    }
                                    onChangeText={value => (
                                        setCheckAddress(true),
                                        setFormData(prevFormData => ({
                                            ...prevFormData,
                                            recipientAddress: value
                                        }))
                                    )}
                                    isError={(error.recipientAddress && !formData.recipientAddress) || (addressError && formData.recipientAddress)}
                                    style={styles.contentWidth}
                                    returnKeyType={'done'}
                                    error={
                                        (addressError && formData.recipientAddress) ? addressError :
                                            error.recipientAddress
                                                ? trans('This field is required.')
                                                : ''
                                    }
                                />
                                <Text style={[styles.info, styles.contentWidth]}>{'*' + trans('Only send {{x}} token to this address, receiving any other coin will result in permanent loss.', { x: formData?.code })}</Text>
                            </View>
                            <View style={styles.mb_16}>
                                <CustomInput
                                    label={trans('Amount') + '*'}
                                    placeholder={minLimit}
                                    keyboardAppearance={'dark'}
                                    value={amount}
                                    keyboardType={'number-pad'}
                                    inputMode={'numeric'}
                                    onChangeText={text => {
                                        setAmount(
                                            debounceValidation(
                                                text,
                                                8,
                                                decimalValue ? decimalValue : decimal_format_amount_crypto,
                                                count,
                                            ),
                                        );
                                    }}
                                    isError={(amountError && amount) ||
                                        (error.amount && !amount) || (!(amount > 0) && amount)
                                    }
                                    style={styles.contentWidth}
                                    returnKeyType={'done'}
                                    error={
                                        (amountError && amount) ? amountError :
                                            !(amount > 0) && amount
                                                ? trans('Please enter a valid number.')
                                                : error.amount
                                                    ? trans('This field is required.')
                                                    : ''
                                    }
                                // maxLength={Number(count.current)}
                                />
                                <Text style={[styles.info, styles.contentWidth]}>{'*' + trans('The amount withdrawn/send must at least be {{x}} {{y}}', { x: minLimit, y: formData?.code })}</Text>
                                <Text style={[styles.info, styles.contentWidth]}>{'*' + trans('Please keep at least 10 {{x}} for network fees.', { x: formData?.network })}</Text>
                                <Text style={[styles.info, styles.contentWidth]}>{'*' + trans('Network Fee will be deduct from your native {{x}} wallet.', { x: formData?.network })}</Text>
                            </View>
                            <CustomButton
                                title={trans('Proceed')}
                                onPress={() => handleProceed()}
                                bgColor={colors.cornflowerBlue}
                                disabled={(checkAddress || amountCheck) ? true : false}
                                style={styles.btnWidth}
                                color={colors.white}
                            />
                            <TouchableOpacity onPress={() => navigation.navigate(HOME)}>
                                <Text style={styles.cancelBtn}>{trans('Cancel')}</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                </ScrollView>
            </KeyboardAvoidingView>
        </>
    );
};

export default memo(CreateSendCryptoToken);
