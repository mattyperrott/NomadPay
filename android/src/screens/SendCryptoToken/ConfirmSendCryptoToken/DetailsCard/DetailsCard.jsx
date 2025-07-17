import {View, Text} from 'react-native';
import React from 'react';
import {useTheme} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import CardInfo from '../../../components/CardInfo/CardInfo';

const DetailsCard = ({data, style}) => {
  const {colors} = useTheme();
  const {recipientAddress, floatAmount, fee, code, network} =
    data;
  const {t: trans} = useTranslation();
  
  return (
    <View style={style.container}>
      <Text style={[style.headerText, style.pb_4]}>{trans('Details')}</Text>
      <CardInfo title={trans('Recipient Address')} text={recipientAddress} />
      <CardInfo
        title={trans('Amount')}
        text={floatAmount + ' ' + code}
        statusColor={colors.textNonaryVariant}
      />
      <CardInfo
        title={trans('Network Fee')}
        text={fee + ' ' + network}
        statusColor={colors.textNonaryVariant}
      />
      <CardInfo
        title={trans('Total')}
        text={floatAmount + ' ' + code}
        statusColor={colors.textNonaryVariant}
        last={true}
      />
    </View>
  );
};

export default DetailsCard;
