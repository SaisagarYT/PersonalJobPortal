abstract class ProfileEvent {}

class ProfileLoadRequested extends ProfileEvent {}

class ProfileUpdateRequested extends ProfileEvent {
  final String? name;
  final String? currentRole;
  final String? location;
  final List<String>? skills;
  ProfileUpdateRequested({this.name, this.currentRole, this.location, this.skills});
}

class ProfileLogoutRequested extends ProfileEvent {}
