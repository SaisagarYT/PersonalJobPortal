abstract class AuthEvent {}

class AuthStarted extends AuthEvent {}

class AuthLoginRequested extends AuthEvent {
  final String email;
  final String password;
  AuthLoginRequested({required this.email, required this.password});
}

class AuthSignupRequested extends AuthEvent {
  final String email;
  final String password;
  final String name;
  AuthSignupRequested({required this.email, required this.password, required this.name});
}

class AuthLogoutRequested extends AuthEvent {}
