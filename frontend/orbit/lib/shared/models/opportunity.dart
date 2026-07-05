class Compensation {
  final int min;
  final int max;
  final String currency;
  final String type;
  final bool isPaid;

  const Compensation({
    required this.min,
    required this.max,
    required this.currency,
    required this.type,
    required this.isPaid,
  });

  factory Compensation.fromJson(Map<String, dynamic> json) => Compensation(
        min: json['min'] as int? ?? 0,
        max: json['max'] as int? ?? 0,
        currency: json['currency'] as String? ?? 'INR',
        type: json['type'] as String? ?? 'monthly',
        isPaid: json['is_paid'] as bool? ?? false,
      );
}

class Opportunity {
  final String id;
  final String externalId;
  final String source;
  final String sourceUrl;
  final String title;
  final String type;
  final String employmentType;
  final String companyName;
  final String companyLogo;
  final String description;
  final String shortDescription;
  final Compensation compensation;
  final List<String> locations;
  final List<String> skills;
  final List<String> categories;
  final int experienceMin;
  final int experienceMax;
  final String experienceLevel;
  final int durationValue;
  final String durationUnit;
  final String? deadline;
  final int applicantsCount;
  final bool isActive;
  final String applyUrl;
  final String? postedDate;
  final String fetchedAt;

  const Opportunity({
    required this.id,
    required this.externalId,
    required this.source,
    required this.sourceUrl,
    required this.title,
    required this.type,
    required this.employmentType,
    required this.companyName,
    required this.companyLogo,
    required this.description,
    required this.shortDescription,
    required this.compensation,
    required this.locations,
    required this.skills,
    required this.categories,
    required this.experienceMin,
    required this.experienceMax,
    required this.experienceLevel,
    required this.durationValue,
    required this.durationUnit,
    this.deadline,
    required this.applicantsCount,
    required this.isActive,
    required this.applyUrl,
    this.postedDate,
    required this.fetchedAt,
  });

  factory Opportunity.fromJson(Map<String, dynamic> json) {
    List<String> parseStringList(dynamic raw) {
      if (raw == null) return [];
      if (raw is List) return raw.map((e) => e.toString()).toList();
      if (raw is String) {
        try {
          // handle JSON string like '["React", "Node"]'
          final cleaned = raw.replaceAll(RegExp(r'[\[\]"]'), '').split(',');
          return cleaned.map((e) => e.trim()).where((e) => e.isNotEmpty).toList();
        } catch (_) {
          return [];
        }
      }
      return [];
    }

    List<String> parseLocations(dynamic raw) {
      if (raw == null) return [];
      if (raw is List) {
        return raw.map((l) {
          if (l is Map) {
            final city = l['city'] as String? ?? '';
            final isRemote = l['is_remote'] as bool? ?? false;
            if (isRemote) return 'Remote';
            return city.isNotEmpty ? city : 'Unknown';
          }
          return l.toString();
        }).toList();
      }
      if (raw is String) return [raw];
      return [];
    }

    final comp = json['compensation'];
    return Opportunity(
      id: json['id']?.toString() ?? '',
      externalId: json['external_id']?.toString() ?? '',
      source: json['source']?.toString() ?? '',
      sourceUrl: json['source_url']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      type: json['type']?.toString() ?? 'internship',
      employmentType: json['employment_type']?.toString() ?? '',
      companyName: json['company_name']?.toString() ?? '',
      companyLogo: json['company_logo']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      shortDescription: json['short_description']?.toString() ?? '',
      compensation: comp != null && comp is Map<String, dynamic>
          ? Compensation.fromJson(comp)
          : const Compensation(min: 0, max: 0, currency: 'INR', type: 'monthly', isPaid: false),
      locations: parseLocations(json['locations']),
      skills: parseStringList(json['skills']),
      categories: parseStringList(json['categories']),
      experienceMin: json['experience_min'] as int? ?? 0,
      experienceMax: json['experience_max'] as int? ?? 0,
      experienceLevel: json['experience_level']?.toString() ?? 'fresher',
      durationValue: json['duration_value'] as int? ?? 0,
      durationUnit: json['duration_unit']?.toString() ?? 'months',
      deadline: json['deadline']?.toString(),
      applicantsCount: json['applicants_count'] as int? ?? 0,
      isActive: json['is_active'] as bool? ?? true,
      applyUrl: json['apply_url']?.toString() ?? '',
      postedDate: json['posted_date']?.toString(),
      fetchedAt: json['fetched_at']?.toString() ?? '',
    );
  }

  String get salaryDisplay {
    if (!compensation.isPaid) return 'Unpaid';
    if (compensation.min == 0 && compensation.max == 0) return 'Stipend TBD';
    final sym = compensation.currency == 'INR' ? '₹' : '\$';
    if (compensation.max == compensation.min || compensation.max == 0) {
      return '$sym${_fmt(compensation.min)}';
    }
    return '$sym${_fmt(compensation.min)} – ${_fmt(compensation.max)}';
  }

  String _fmt(int v) {
    if (v >= 100000) return '${(v / 100000).toStringAsFixed(1)}L';
    if (v >= 1000) return '${(v / 1000).toStringAsFixed(0)}K';
    return v.toString();
  }

  String get locationDisplay {
    if (locations.isEmpty) return 'Location TBD';
    if (locations.length == 1) return locations.first;
    return '${locations.first} +${locations.length - 1}';
  }
}
