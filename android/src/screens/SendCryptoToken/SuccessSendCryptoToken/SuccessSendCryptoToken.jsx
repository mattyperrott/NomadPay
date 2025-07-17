import { View, Text, TouchableOpacity, BackHandler } from 'react-native';
import React, { useEffect, useRef } from 'react';
import { useTheme } from '@react-navigation/native';
import { successMoneyRequestStyle } from '../../RequestMoney/Create/SucessRequest/successMoneyRequest.style';
import MyStatusBar from '../../../utils/MyStatusBar/MyStatusBar';
import CustomButton from '../../components/Buttons/CustomButton/CustomButton';
import { CREATE_SEND_CRYPTO_TOKEN, HOME } from '../../../navigation/routeName/routeName';
import { useTranslation } from 'react-i18next';
import Lottie from 'lottie-react-native';
import { getMyWallets } from '../../../features/slices/myWallets/myWallets';
import { useDispatch, useSelector } from 'react-redux';

const SuccessSendCryptoToken = ({ route, navigation }) => {
  const {
    params: { data = {} },
  } = route;
  const { floatAmount, code, recipientAddress } = data;
  const ref = useRef();
  const { user: { token = '' } = {} } = useSelector(
    state => state.loginUserReducer,
  );
  const { colors } = useTheme();
  const { t: trans } = useTranslation();
  const dispatch = useDispatch();
  let controlBackHandler;
  useEffect(() => {
    controlBackHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => true,
    );
  }, []);
  useEffect(() => {
    if (ref.current) {
      ref.current?.play();
    }
  }, []);
  const sendAgain = async () => {
    controlBackHandler?.remove();
    dispatch(getMyWallets({ token }));
    navigation.navigate(CREATE_SEND_CRYPTO_TOKEN);
  };
  const handleBackToHome = () => {
    controlBackHandler?.remove();
    dispatch(getMyWallets({ token }));
    navigation.navigate(HOME);
  };
  const styles = successMoneyRequestStyle(colors);
  return (
    <>
      <MyStatusBar backgroundColor={colors.bgTertiary} />
      <View style={styles.container}>
        <View style={styles.successLoader}>
          <Lottie
            ref={ref}
            source={require('../../../assets/lottie/successLoader.json')}
            autoPlay={false}
            loop={false}
          />
        </View>
        <Text style={styles.success}>{trans('Success')}!</Text>
        <Text style={styles.description}>
          {trans('You have successfully sent')}{' '}
          <Text style={styles.amountText}>
            {floatAmount} {code}{' '}
          </Text>
          {trans('to')} ({recipientAddress})
        </Text>
        <CustomButton
          title={trans('Send Again')}
          onPress={sendAgain}
          bgColor={colors.cornflowerBlue}
          style={styles.customButton}
          color={colors.white}
        />
        <TouchableOpacity onPress={handleBackToHome}>
          <Text style={styles.backHomeBtn}>{trans('Back to Home')}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};
export default SuccessSendCryptoToken;
