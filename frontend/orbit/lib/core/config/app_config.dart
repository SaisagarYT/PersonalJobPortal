class AppConfig {
  AppConfig._();

  /// Injected at build time via --dart-define=API_BASE_URL=https://...
  /// Falls back to the production Render URL if not set.
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://orbit-api-pz36.onrender.com/api/v1',
  );

  static const Duration connectTimeout = Duration(seconds: 20);
  static const Duration receiveTimeout = Duration(seconds: 30);
}
