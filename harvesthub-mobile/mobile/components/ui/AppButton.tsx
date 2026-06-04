import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
}

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
}: AppButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.button, styles[variant], (disabled || loading) && styles.disabled]}>
      {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={[styles.text, variant === 'primary' && styles.textPrimary]}>{title}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primary: {
    backgroundColor: '#1f7a45',
  },
  secondary: {
    backgroundColor: '#dbeee0',
  },
  danger: {
    backgroundColor: '#b42318',
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    color: '#1f7a45',
    fontSize: 16,
    fontWeight: '700',
  },
  textPrimary: {
    color: '#ffffff',
  },
});
