class UserProfile {
  final String id;
  final String email;
  final String name;
  final String currentRole;
  final String location;
  final List<String> skills;
  final Map<String, dynamic> jobPreferences;

  const UserProfile({
    required this.id,
    required this.email,
    required this.name,
    required this.currentRole,
    required this.location,
    required this.skills,
    required this.jobPreferences,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    List<String> parseSkills(dynamic raw) {
      if (raw == null) return [];
      if (raw is List) return raw.map((e) => e.toString()).toList();
      return [];
    }

    return UserProfile(
      id: json['id']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      currentRole: json['current_role']?.toString() ?? '',
      location: json['location']?.toString() ?? '',
      skills: parseSkills(json['skills']),
      jobPreferences: (json['job_preferences'] is Map)
          ? Map<String, dynamic>.from(json['job_preferences'] as Map)
          : {},
    );
  }

  UserProfile copyWith({
    String? name,
    String? currentRole,
    String? location,
    List<String>? skills,
    Map<String, dynamic>? jobPreferences,
  }) =>
      UserProfile(
        id: id,
        email: email,
        name: name ?? this.name,
        currentRole: currentRole ?? this.currentRole,
        location: location ?? this.location,
        skills: skills ?? this.skills,
        jobPreferences: jobPreferences ?? this.jobPreferences,
      );
}
