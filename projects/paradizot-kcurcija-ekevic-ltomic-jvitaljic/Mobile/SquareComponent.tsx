import React from 'react';
import { TouchableOpacity, Image, Text, StyleSheet, ViewStyle } from 'react-native';

type SquareItemProps ={
  label: string;
  icon: any;
  onPress: () => void;
  style?: ViewStyle;  // optional extra style
}

const SquareItem = ({ label, icon, onPress, style }: SquareItemProps) => {
  return (
    <TouchableOpacity style={[styles.square, style]} onPress={onPress}>
      <Image source={icon} style={styles.icon} />
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  square: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: '#e8ecf4',
    borderRadius: 16,
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  icon: {
    width: 50,
    height: 50,
    marginBottom: 10,
    resizeMode: 'contain',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066cc',
    textAlign: 'center',
  },
});

export default SquareItem;
