import 'opportunity.dart';

class InterviewRound {
  final String id;
  final String roundName;
  final String? scheduledAt;
  final String status;
  final String notes;

  const InterviewRound({
    required this.id,
    required this.roundName,
    this.scheduledAt,
    required this.status,
    required this.notes,
  });

  factory InterviewRound.fromJson(Map<String, dynamic> json) => InterviewRound(
        id: json['id']?.toString() ?? '',
        roundName: json['round_name']?.toString() ?? '',
        scheduledAt: json['scheduled_at']?.toString(),
        status: json['status']?.toString() ?? 'scheduled',
        notes: json['notes']?.toString() ?? '',
      );
}

class Application {
  final String id;
  final String opportunityId;
  final String stage;
  final String notes;
  final String? appliedAt;
  final String? createdAt;
  final Opportunity? opportunity;
  final List<InterviewRound> rounds;

  const Application({
    required this.id,
    required this.opportunityId,
    required this.stage,
    required this.notes,
    this.appliedAt,
    this.createdAt,
    this.opportunity,
    required this.rounds,
  });

  factory Application.fromJson(Map<String, dynamic> json) {
    final oppJson = json['opportunities'];
    Opportunity? opp;
    if (oppJson != null && oppJson is Map<String, dynamic>) {
      // opportunity join returns flat compensation columns
      opp = Opportunity.fromFlatJson(oppJson);
    }

    final roundsList = json['interview_rounds'];
    final rounds = (roundsList is List)
        ? roundsList.map((r) => InterviewRound.fromJson(r as Map<String, dynamic>)).toList()
        : <InterviewRound>[];

    return Application(
      id: json['id']?.toString() ?? '',
      opportunityId: json['opportunity_id']?.toString() ?? '',
      stage: json['stage']?.toString() ?? 'saved',
      notes: json['notes']?.toString() ?? '',
      appliedAt: json['applied_at']?.toString(),
      createdAt: json['created_at']?.toString(),
      opportunity: opp,
      rounds: rounds,
    );
  }

  Application copyWith({String? stage, String? notes}) => Application(
        id: id,
        opportunityId: opportunityId,
        stage: stage ?? this.stage,
        notes: notes ?? this.notes,
        appliedAt: appliedAt,
        createdAt: createdAt,
        opportunity: opportunity,
        rounds: rounds,
      );
}
