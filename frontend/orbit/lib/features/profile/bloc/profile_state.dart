import '../../../shared/models/user_profile.dart';

abstract class ProfileState {}

class ProfileInitial extends ProfileState {}

class ProfileLoading extends ProfileState {}

class ProfileLoaded extends ProfileState {
  final UserProfile profile;
  final bool saving;

  ProfileLoaded({required this.profile, this.saving = false});

  ProfileLoaded copyWith({UserProfile? profile, bool? saving}) =>
      ProfileLoaded(
        profile: profile ?? this.profile,
        saving: saving ?? this.saving,
      );
}

class ProfileError extends ProfileState {
  final String message;
  ProfileError(this.message);
}
