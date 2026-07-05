import '../../../shared/models/application.dart';

abstract class TrackerState {}

class TrackerInitial extends TrackerState {}

class TrackerLoading extends TrackerState {}

class TrackerLoaded extends TrackerState {
  final List<Application> applications;
  final Map<String, int> summary;

  TrackerLoaded({required this.applications, required this.summary});

  List<Application> byStage(String stage) =>
      applications.where((a) => a.stage == stage).toList();

  TrackerLoaded copyWith({List<Application>? applications, Map<String, int>? summary}) =>
      TrackerLoaded(
        applications: applications ?? this.applications,
        summary: summary ?? this.summary,
      );
}

class TrackerError extends TrackerState {
  final String message;
  TrackerError(this.message);
}
