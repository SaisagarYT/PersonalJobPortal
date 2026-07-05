import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';
import '../../../features/auth/bloc/auth_bloc.dart';
import '../../../features/auth/bloc/auth_event.dart';
import '../../../shared/models/user_profile.dart';
import 'profile_event.dart';
import 'profile_state.dart';

class ProfileBloc extends Bloc<ProfileEvent, ProfileState> {
  final _api = ApiClient.instance;
  final AuthBloc authBloc;

  ProfileBloc({required this.authBloc}) : super(ProfileInitial()) {
    on<ProfileLoadRequested>(_onLoad);
    on<ProfileUpdateRequested>(_onUpdate);
    on<ProfileLogoutRequested>(_onLogout);
  }

  Future<void> _onLoad(ProfileLoadRequested event, Emitter<ProfileState> emit) async {
    emit(ProfileLoading());
    try {
      final resp = await _api.dio.get('/user/profile');
      final data = resp.data['profile'] as Map<String, dynamic>? ?? {};
      emit(ProfileLoaded(profile: UserProfile.fromJson(data)));
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] ?? 'Failed to load profile.';
      emit(ProfileError(msg.toString()));
    } catch (e) {
      emit(ProfileError('Something went wrong: ${e.toString()}'));
    }
  }

  Future<void> _onUpdate(ProfileUpdateRequested event, Emitter<ProfileState> emit) async {
    final current = state;
    if (current is! ProfileLoaded) return;
    emit(current.copyWith(saving: true));
    try {
      final payload = <String, dynamic>{};
      if (event.name != null) payload['name'] = event.name;
      if (event.currentRole != null) payload['current_role'] = event.currentRole;
      if (event.location != null) payload['location'] = event.location;
      if (event.skills != null) payload['skills'] = event.skills;

      final resp = await _api.dio.patch('/user/profile', data: payload);
      final data = resp.data['profile'] as Map<String, dynamic>? ?? {};
      emit(ProfileLoaded(profile: UserProfile.fromJson(data)));
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] ?? 'Failed to save profile.';
      emit(current.copyWith(saving: false));
      emit(ProfileError(msg.toString()));
    } catch (_) {
      emit(current.copyWith(saving: false));
    }
  }

  Future<void> _onLogout(ProfileLogoutRequested event, Emitter<ProfileState> emit) async {
    authBloc.add(AuthLogoutRequested());
  }
}
