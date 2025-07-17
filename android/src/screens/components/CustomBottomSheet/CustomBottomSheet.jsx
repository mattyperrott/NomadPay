import React, {useCallback, useMemo} from 'react';
import {
  BottomSheetScrollView,
  BottomSheetBackdrop,
  BottomSheetHandle,
  useBottomSheetDynamicSnapPoints,
  useBottomSheetTimingConfigs,
  BottomSheetModalProvider,
  BottomSheetModal,
} from '@gorhom/bottom-sheet';
import {useTheme} from '@react-navigation/native';
import {bottomSheetStyles} from './bottomSheet.style';
import { Pressable} from 'react-native';


export const CustomBottomSheet = ({
  style = {},
  bottomSheetRef,
  snapPoint,
  bgColor,
  indicatorColor,
  children,
  contentHeight = true,
  header,
  footer,
  scroll=true
}) => {
  const initialSnapPoints = useMemo(
    () => ['CONTENT_HEIGHT', ...snapPoint],
    [snapPoint],
  );
  const {
    animatedHandleHeight,
    animatedSnapPoints,
    animatedContentHeight,
    handleContentLayout,
  } = useBottomSheetDynamicSnapPoints(initialSnapPoints);
  const {colors} = useTheme();

  const bottomSheetStyle = bottomSheetStyles(colors, indicatorColor, bgColor);

  const renderBackdrop = useCallback(props => {
    return (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.2}
      />
    );
  }, []);


  const animationConfigs = useBottomSheetTimingConfigs({
    duration: 500,
  });

  const renderBottomSheetHandle = () => {
    return (
      <Pressable onPress={() => bottomSheetRef?.current?.close()}>
        <BottomSheetHandle
          indicatorStyle={bottomSheetStyle.bottomSheetIndicator}
        />
      </Pressable>
    );
  };


  return (
    <BottomSheetModalProvider>
      <BottomSheetModal
        ref={bottomSheetRef}
        index={0}
        enablePanDownToClose={true}
        backdropComponent={renderBackdrop}
        animationConfigs={animationConfigs}
        handleComponent={renderBottomSheetHandle}
        backgroundStyle={bottomSheetStyle.backgroundStyle}
        snapPoints={contentHeight ? animatedSnapPoints : snapPoint}
        handleHeight={animatedHandleHeight}
        contentHeight={contentHeight && animatedContentHeight}
        >
        {header}
        <BottomSheetScrollView
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={scroll}
          contentContainerStyle={
            !header ? [bottomSheetStyle.contentContainer, style] : style
          }
          scrollEnabled={true}
          onLayout={handleContentLayout}>
          {children}
        </BottomSheetScrollView>
        {footer}
      </BottomSheetModal>
    </BottomSheetModalProvider>
  );
};

export default CustomBottomSheet