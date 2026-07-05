import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';
import '../../../shared/models/application.dart';
import 'tracker_event.dart';
import 'tracker_state.dart';

class TrackerBloc extends Bloc<TrackerEvent, TrackerState> {
  final _api = ApiClient.instance;

  TrackerBloc() : super(TrackerInitial()) {
    on<TrackerLoadRequested>(_onLoad);
    on<TrackerStageUpdated>(_onStageUpdate);
    on<TrackerApplicationDeleted>(_onDelete);
  }

  Future<void> _onLoad(TrackerLoadRequested event, Emitter<TrackerState> emit) async {
    emit(TrackerLoading());
    try {
      final resp = await _api.dio.get('/applications');
      final raw = resp.data['applications'] as List? ?? [];
      final apps = raw.map((e) => Application.fromJson(e as Map<String, dynamic>)).toList();
      final summaryRaw = resp.data['summary'];
      final summary = summaryRaw is Map
          ? Map<String, int>.from(summaryRaw.map((k, v) => MapEntry(k.toString(), (v as num).toInt())))
          : <String, int>{};
      emit(TrackerLoaded(applications: apps, summary: summary));
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] ?? 'Failed to load applications.';
      emit(TrackerError(msg.toString()));
    } catch (e) {
      emit(TrackerError('Something went wrong: ${e.toString()}'));
    }
  }

  Future<void> _onStageUpdate(TrackerStageUpdated event, Emitter<TrackerState> emit) async {
    final current = state;
    if (current is! TrackerLoaded) return;

    // Optimistic update
    final updated = current.applications.map((a) {
      return a.id == event.applicationId ? a.copyWith(stage: event.newStage) : a;
    }).toList();
    emit(current.copyWith(applications: updated));

    try {
      await _api.dio.patch('/applications/${event.applicationId}/stage', data: {'stage': event.newStage});
    } on DioException catch (_) {
      // Revert on failure
      emit(current);
    }
  }

  Future<void> _onDelete(TrackerApplicationDeleted event, Emitter<TrackerState> emit) async {
    final current = state;
    if (current is! TrackerLoaded) return;
    try {
      await _api.dio.delete('/applications/${event.applicationId}');
      final apps = current.applications.where((a) => a.id != event.applicationId).toList();
      emit(current.copyWith(applications: apps));
    } catch (_) {}
  }
}
