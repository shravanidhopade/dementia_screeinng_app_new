import { StyleSheet } from 'react-native';

// Stitch Design System: The Empathetic Guardian (Professional Medical Choice)
export const colors = {
  primary: '#003f87',          // Main medical blue
  primaryContainer: '#0056b3', // Gradient light blue
  secondary: '#2a6b2c',        // Professional green
  secondaryContainer: '#acf4a4',
  tertiary: '#553e00',         // Muted professional yellow
  background: '#fdf8fd',       // Soft off-white base
  surface: '#ffffff',          // High focus cards
  surfaceContainer: '#f1f3f8', // Structural grouping (no lines)
  text: '#1c1b1f',             // High legibility ink
  lightText: '#424752',
  error: '#ba1a1a',            // Standard medical error red
  success: '#2ECC71',          // Bright green for reaction test
  redCircle: '#E53935',        // Red circle for attention test
  blueCircle: '#1E88E5',       // Blue circle (distractor) for attention test
  border: 'transparent',       // No-Line Rule: boundaries via tone
};

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 20,
    color: colors.lightText,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 28,
  },
  text: {
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
    lineHeight: 26,
  },
  button: {
    // Buttons are now managed by CustomButton with Gradients
    height: 56, // Minimum high-end touch target
    borderRadius: 28,
    overflow: 'hidden',
    marginVertical: 12,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    marginVertical: 12,
    width: '100%',
    // Depth achieved via subtle tonality, not harsh lines
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  well: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 20,
    padding: 20,
    marginVertical: 10,
  },
  input: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 16,
    padding: 18,
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  }
});
