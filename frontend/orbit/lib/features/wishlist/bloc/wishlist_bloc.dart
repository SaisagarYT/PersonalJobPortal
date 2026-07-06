import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';
import '../../../shared/models/opportunity.dart';
import 'wishlist_event.dart';
import 'wishlist_state.dart';

class WishlistBloc extends Bloc<WishlistEvent, WishlistState> {
  final _api = ApiClient.instance;

  WishlistBloc() : super(WishlistInitial()) {
    on<WishlistLoadRequested>(_onLoad);
    on<WishlistSaveRequested>(_onSave);
    on<WishlistRemoveRequested>(_onRemove);
  }

  Future<void> _onLoad(WishlistLoadRequested event, Emitter<WishlistState> emit) async {
    emit(WishlistLoading());
    try {
      final resp = await _api.dio.post('/wishlist/all', data: {});
      final raw = resp.data['data'] as List? ?? [];
      final items = raw.map((e) {
        final oppJson = e['opportunities'] as Map<String, dynamic>? ?? {};
        return Opportunity.fromFlatJson(oppJson);
      }).where((o) => o.id.isNotEmpty).toList();
      final ids = items.map((o) => o.id).toSet();
      emit(WishlistLoaded(items: items, savedIds: ids));
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] ?? 'Failed to load saved jobs.';
      emit(WishlistError(msg.toString()));
    } catch (e) {
      emit(WishlistError('Something went wrong: ${e.toString()}'));
    }
  }

  Future<void> _onSave(WishlistSaveRequested event, Emitter<WishlistState> emit) async {
    final current = state;
    // Optimistic update: add to both items and savedIds immediately
    if (current is WishlistLoaded) {
      final alreadyIn = current.items.any((o) => o.id == event.opportunityId);
      final newItems = alreadyIn
          ? current.items
          : [event.opportunity, ...current.items];
      emit(current.copyWith(
        items: newItems,
        savedIds: {...current.savedIds, event.opportunityId},
      ));
    } else {
      emit(WishlistLoaded(
        items: [event.opportunity],
        savedIds: {event.opportunityId},
      ));
    }
    try {
      await _api.dio.post('/wishlist', data: {'opportunity_id': event.opportunityId});
    } catch (_) {
      // Revert on failure
      final updated = state;
      if (updated is WishlistLoaded) {
        emit(updated.copyWith(
          items: updated.items.where((o) => o.id != event.opportunityId).toList(),
          savedIds: {...updated.savedIds}..remove(event.opportunityId),
        ));
      }
    }
  }

  Future<void> _onRemove(WishlistRemoveRequested event, Emitter<WishlistState> emit) async {
    final current = state;
    if (current is WishlistLoaded) {
      final ids = {...current.savedIds}..remove(event.opportunityId);
      final items = current.items.where((o) => o.id != event.opportunityId).toList();
      emit(current.copyWith(items: items, savedIds: ids));
    }
    try {
      await _api.dio.delete('/wishlist', data: {'opportunity_id': event.opportunityId});
    } catch (_) {
      // Revert on failure — reload from server
      add(WishlistLoadRequested());
    }
  }

  bool isSaved(String id) {
    final s = state;
    return s is WishlistLoaded && s.savedIds.contains(id);
  }
}
