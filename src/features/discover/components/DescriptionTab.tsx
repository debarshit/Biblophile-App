import React from 'react';
import { View, Text, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';
import ProductOptions from './ProductOptions';
import RequestBookButton from './RequestBookButton';

const DescriptionTab = ({ 
  product, 
  isGoogleBook, 
  fullDesc, 
  setFullDesc, 
  prices, 
  price, 
  setPrice, 
  type, 
  id, 
  actualPrice,
  userDetails,
  stripHtmlTags
}) => {
  const hasRentOption = prices.some(p => p.size === 'Rent');

  return (
    <View style={styles.TabContent}>
      <Text style={styles.InfoTitle}>Description</Text>
      {fullDesc ? (
        <TouchableWithoutFeedback onPress={() => setFullDesc(prev => !prev)}>
          <Text style={styles.DescriptionText}>
            {stripHtmlTags(isGoogleBook ? product['volumeInfo']?.description : product['ProductDescription'])}
          </Text>
        </TouchableWithoutFeedback>
      ) : (
        <TouchableWithoutFeedback onPress={() => setFullDesc(prev => !prev)}>
          <Text numberOfLines={3} style={styles.DescriptionText}>
            {stripHtmlTags(isGoogleBook ? product['volumeInfo']?.description : product['ProductDescription'])}
          </Text>
        </TouchableWithoutFeedback>
      )}
      <>
        <Text style={styles.InfoTitle}>Options</Text>
          <ProductOptions 
            prices={prices} 
            selectedPrice={price} 
            onSelectPrice={setPrice} 
            type={type} 
          />
          {!hasRentOption && <RequestBookButton 
            id={id} 
            isGoogleBook={isGoogleBook} 
            product={product}
            userDetails={userDetails}
            actualPrice={actualPrice}
          />}
      </>
    </View>
  );
};

const styles = StyleSheet.create({
  TabContent: {
    flexGrow: 1,
    padding: SPACING.space_20,
  },
  InfoTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_10,
  },
  DescriptionText: {
    letterSpacing: 0.5,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_30,
  },
});

export default DescriptionTab;