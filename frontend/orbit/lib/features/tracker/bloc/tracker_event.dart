abstract class TrackerEvent {}

class TrackerLoadRequested extends TrackerEvent {}

class TrackerStageUpdated extends TrackerEvent {
  final String applicationId;
  final String newStage;
  TrackerStageUpdated({required this.applicationId, required this.newStage});
}

class TrackerApplicationDeleted extends TrackerEvent {
  final String applicationId;
  TrackerApplicationDeleted(this.applicationId);
}
