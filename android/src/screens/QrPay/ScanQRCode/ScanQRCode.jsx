import {Dimensions, StyleSheet, Text, View} from 'react-native';
import React, {useState, useEffect, memo, useContext} from 'react';
import {Camera, useCameraDevice, useCameraPermission, useCodeScanner} from 'react-native-vision-camera';
import config from '../../../../config';
import {postInfo} from '../../../features/auth/login/loginApi';
import {useSelector} from 'react-redux';
import {useIsFocused, useTheme} from '@react-navigation/native';
import {handleToaster} from '../../../utils/CustomAlert/handleAlert';
import {scanQRCodeStyles} from './scanQRCode.style';
import {useTranslation} from 'react-i18next';
import QRScanIcon from '../../../assets/svg/QRscan.svg';
import {rs} from '../../../utils/styles/responsiveSize';
import QrCode from '../../../assets/svg/qr-code.svg';
import {CONFIRM_STANDARD_MERCHANT, MANAGE_EXPRESS_PAYMENT} from '../../../navigation/routeName/routeName';
import { NetworkContext } from '../../../utils/Network/NetworkProvider';
import {PERMISSIONS, request, RESULTS} from 'react-native-permissions'
const {width} = Dimensions.get('screen');


const ScanQRCode = ({navigation, route}) => {
  const qrMethod = route?.params?.method;
  const {user: {token, email} = {}} =
    useSelector(state => state.loginUserReducer) || {};
  const isFocused = useIsFocused();
  const {t: trans} = useTranslation();
  const device = useCameraDevice('back')
  const { hasPermission, requestPermission } = useCameraPermission()

  const {colors} = useTheme();
  const styles = scanQRCodeStyles(colors);
  const {isConnected} = useContext(NetworkContext);
  const [isScanned, setIsScanned] = useState(false);
  const [barcodes, setBarcodes] = useState([]);

  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13'],
    onCodeScanned: (codes) => {
      setBarcodes(codes); 
    }
  })
  

  useEffect(() => {

    (async () => {
      if(!hasPermission){
        const result = await request(
          Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA,
          {
            title: 'Camera Permission',
            message:
              'App needs access to your camera ' +
              'so you can scan the Qr code',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );

        if (result != 'granted' ) {
          handleToaster(trans('Please grant camera permission to access your camera and try again.'), 'error', colors);
          setTimeout(() => { navigation.goBack() }, 1000);
          return;
        } 
      }
     
    })();
  }, []);

  useEffect(() => {
    toggleActiveState();
    return () => {
      barcodes;
    };
  }, [barcodes]);

  const handleError = (message) => {
    setTimeout(() => setIsScanned(false), 3000);  
    handleToaster(trans(message), 'qrScan', colors, false);
  };
const handleBarcode = async (scannedBarcode) => {
  if (!scannedBarcode || !scannedBarcode.value) {
    handleError(trans('Invalid code. Please try again.'));
    return;
  }
  if (!isConnected){
    handleError(trans('Please connect your network and try again'));
    return;
  }
  if(qrMethod?.method === 'Send Crypto' || qrMethod?.method === 'Send Crypto Token' || qrMethod?.method === 'Crypto Exchange'){
    navigation.navigate(qrMethod?.goToScreen, { data: scannedBarcode.value, exchangeData: qrMethod?.exchangeData, proofInfo: qrMethod?.proofInfo ? qrMethod.proofInfo : null});
    return;
  }
  const URL =
    qrMethod?.method === 'Merchant Payment'
    ? `${config.BASE_URL_VERSION}/qr-code/merchant-qr-operation`
    : `${config.BASE_URL_VERSION}/qr-code/send-request-qr-operation`;

  const obj = { secret_text: scannedBarcode.value };
  const res = await postInfo(obj, URL, token, 'POST');
  const { status, records } = res?.response;

  switch (qrMethod?.method) {
    case 'Merchant Payment':
      if (status?.code !== 200) {
        handleError(trans(status?.message));
      } else {
        switch (records?.userType) {
          case 'standard_merchant':
            const standardURL = `${config.BASE_URL_VERSION}/qr-code/standard-merchant-payment-review`;
            const standardObj = {
              merchant_id: records.merchantId,
              currency_code: records.merchantDefaultCurrencyCode,
              amount: records.merchantPaymentAmount,
            };
            const standardRes = await postInfo(standardObj, standardURL, token, 'POST');
            const { status: standardStatus, records: standardRecords } = standardRes?.response;            
            if (standardStatus?.code === 200) {
              setTimeout(() => setIsScanned(false), 3000);
              navigation.navigate(CONFIRM_STANDARD_MERCHANT, {
                data: standardRecords,
                currency_code: records.merchantDefaultCurrencyCode,
                merchantId: records.merchantId,
              });
            } else {
              handleError(trans(standardStatus?.message));
            }
            break;
          case 'express_merchant':
            navigation.navigate(MANAGE_EXPRESS_PAYMENT, { data: records });
            setTimeout(() => setIsScanned(false), 3000);
            break;
          default:
            handleError(trans(status?.message));
        }
      }
      break;

    default:
      if (status?.code !== 200) {
        handleError(trans(status?.message));
      } else {
        setTimeout(() => setIsScanned(false), 3000);
        navigation.navigate(qrMethod?.goToScreen, { data: records });
      }
      break;
  }
};

const toggleActiveState = async () => {
  if (barcodes && barcodes.length > 0 && isScanned === false) {
    setIsScanned(true);
    try {
      await Promise.all(barcodes.map(async (scannedBarcode) => {
        await handleBarcode(scannedBarcode);
      }));
    } catch (error) {
      handleError(trans(error.message))
    }        
  }
};


  return (
    device != null &&
    hasPermission && isFocused &&(
      <>
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          codeScanner={codeScanner}
        />
        <View style={styles.svgCont}>
          <QRScanIcon height={width - rs(106)} width={width - rs(106)} />
        </View>
        <View style={styles.scanDescCont}>
          <View style={styles.scanDesc}>
            <QrCode />
            <Text style={styles.scanDescText}>
              {trans('Scan {{x}} QR code for faster {{y}}', {
                x: qrMethod?.method === 'Merchant Payment' ? 'Merchant' : 'User',
                y: qrMethod?.method,
              })}
            </Text>
          </View>
        </View>
      </>
    )
  );
};
export default memo(ScanQRCode);