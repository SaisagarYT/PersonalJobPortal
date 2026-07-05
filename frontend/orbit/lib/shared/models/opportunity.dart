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

  /// Parses the flat row shape returned by wishlist/application join queries
  /// where compensation fields are top-level columns instead of nested object.
  factory Opportunity.fromFlatJson(Map<String, dynamic> json) {
    final nested = <String, dynamic>{
      ...json,
      'compensation': {
        'min': json['compensation_min'] ?? 0,
        'max': json['compensation_max'] ?? 0,
        'currency': json['compensation_currency'] ?? 'INR',
        'type': json['compensation_type'] ?? 'monthly',
        'is_paid': json['is_paid'] ?? false,
      },
    };
    return Opportunity.fromJson(nested);
  }

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

    // Backend returns either nested objects (fromRow) or flat columns (join queries).
    // Support both shapes for company, compensation, experience, duration, application.
    final company = json['company'] as Map<String, dynamic>?;
    final comp = json['compensation'] as Map<String, dynamic>?;
    final experience = json['experience'] as Map<String, dynamic>?;
    final duration = json['duration'] as Map<String, dynamic>?;
    final application = json['application'] as Map<String, dynamic>?;

    return Opportunity(
      id: json['id']?.toString() ?? '',
      externalId: json['external_id']?.toString() ?? '',
      source: json['source']?.toString() ?? '',
      sourceUrl: json['source_url']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      type: json['type']?.toString() ?? 'internship',
      employmentType: json['employment_type']?.toString() ?? '',
      companyName: company?['name']?.toString() ?? json['company_name']?.toString() ?? '',
      companyLogo: company?['logo']?.toString() ?? json['company_logo']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      shortDescription: json['short_description']?.toString() ?? '',
      compensation: comp != null
          ? Compensation.fromJson(comp)
          : Compensation(
              min: json['compensation_min'] as int? ?? 0,
              max: json['compensation_max'] as int? ?? 0,
              currency: json['compensation_currency']?.toString() ?? 'INR',
              type: json['compensation_type']?.toString() ?? 'monthly',
              isPaid: json['is_paid'] as bool? ?? false,
            ),
      locations: parseLocations(json['locations']),
      skills: parseStringList(json['skills']),
      categories: parseStringList(json['categories']),
      experienceMin: (experience?['min'] ?? json['experience_min']) as int? ?? 0,
      experienceMax: (experience?['max'] ?? json['experience_max']) as int? ?? 0,
      experienceLevel: experience?['level']?.toString() ?? json['experience_level']?.toString() ?? 'fresher',
      durationValue: (duration?['value'] ?? json['duration_value']) as int? ?? 0,
      durationUnit: duration?['unit']?.toString() ?? json['duration_unit']?.toString() ?? 'months',
      deadline: application?['deadline']?.toString() ?? json['deadline']?.toString(),
      applicantsCount: (application?['applicants_count'] ?? json['applicants_count']) as int? ?? 0,
      isActive: (application?['is_active'] ?? json['is_active']) as bool? ?? true,
      applyUrl: application?['apply_url']?.toString() ?? json['apply_url']?.toString() ?? '',
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
