import React from 'react';
import { TouchableOpacity, Image, Text, StyleSheet } from 'react-native';

type RectangleItemProps ={
  label: string;
  icon: any;
  onPress: () => void;
}

const RectangleItem = ({ label, icon, onPress }: RectangleItemProps) => {
  return (
    <TouchableOpacity style={styles.rectangle} onPress={onPress}>
      <Image source={icon} style={styles.icon} />
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  rectangle: {
    width: '100%',
    height: 120,
    backgroundColor: '#e8ecf4',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  icon: {
    width: 50,
    height: 50,
    marginBottom: 10,
    resizeMode: 'contain',
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0066cc',
  },
});

export default RectangleItem;
