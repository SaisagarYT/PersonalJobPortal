import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';
import 'auth_event.dart';
import 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final _api = ApiClient.instance;

  AuthBloc() : super(AuthInitial()) {
    on<AuthStarted>(_onStarted);
    on<AuthLoginRequested>(_onLogin);
    on<AuthSignupRequested>(_onSignup);
    on<AuthLogoutRequested>(_onLogout);
  }

  Future<void> _onStarted(AuthStarted event, Emitter<AuthState> emit) async {
    final token = await _api.getToken();
    if (token == null) {
      emit(AuthUnauthenticated());
      return;
    }
    try {
      final resp = await _api.dio.get('/auth/me');
      final user = resp.data['user'] as Map<String, dynamic>? ?? {};
      emit(AuthAuthenticated(
        userId: user['id']?.toString() ?? '',
        email: user['email']?.toString() ?? '',
        name: user['user_metadata']?['name']?.toString() ?? user['name']?.toString() ?? '',
      ));
    } catch (_) {
      await _api.clearToken();
      emit(AuthUnauthenticated());
    }
  }

  Future<void> _onLogin(AuthLoginRequested event, Emitter<AuthState> emit) async {
    emit(AuthLoading());
    try {
      final resp = await _api.dio.post('/auth/login', data: {
        'email': event.email,
        'password': event.password,
      });
      final body = resp.data;
      await _api.saveToken(body['token'] as String);
      final user = body['user'] as Map<String, dynamic>? ?? {};
      emit(AuthAuthenticated(
        userId: user['id']?.toString() ?? '',
        email: user['email']?.toString() ?? '',
        name: user['user_metadata']?['name']?.toString() ?? user['name']?.toString() ?? '',
      ));
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] ?? 'Login failed. Check your credentials.';
      emit(AuthError(msg.toString()));
    } catch (_) {
      emit(AuthError('Something went wrong. Please try again.'));
    }
  }

  Future<void> _onSignup(AuthSignupRequested event, Emitter<AuthState> emit) async {
    emit(AuthLoading());
    try {
      final resp = await _api.dio.post('/auth/signup', data: {
        'email': event.email,
        'password': event.password,
        'name': event.name,
      });
      final body = resp.data;
      final token = body['token'];
      if (token != null) {
        await _api.saveToken(token as String);
        final user = body['user'] as Map<String, dynamic>? ?? {};
        emit(AuthAuthenticated(
          userId: user['id']?.toString() ?? '',
          email: user['email']?.toString() ?? '',
          name: event.name,
        ));
      } else {
        // email confirmation required
        emit(AuthUnauthenticated());
      }
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] ?? 'Signup failed.';
      emit(AuthError(msg.toString()));
    } catch (_) {
      emit(AuthError('Something went wrong. Please try again.'));
    }
  }

  Future<void> _onLogout(AuthLogoutRequested event, Emitter<AuthState> emit) async {
    try {
      await _api.dio.post('/auth/logout');
    } catch (_) {}
    await _api.clearToken();
    emit(AuthUnauthenticated());
  }
}
