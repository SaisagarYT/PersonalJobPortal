import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';
import '../../../shared/models/opportunity.dart';
import 'feed_event.dart';
import 'feed_state.dart';

const _pageSize = 20;

class FeedBloc extends Bloc<FeedEvent, FeedState> {
  final _api = ApiClient.instance;

  String? _activeType;
  String? _activeSource;

  FeedBloc() : super(FeedInitial()) {
    on<FeedLoadRequested>(_onLoad);
    on<FeedLoadMore>(_onLoadMore);
    on<FeedFilterChanged>(_onFilter);
  }

  Future<void> _onLoad(FeedLoadRequested event, Emitter<FeedState> emit) async {
    emit(FeedLoading());
    await _fetch(emit, page: 1, reset: true);
  }

  Future<void> _onLoadMore(FeedLoadMore event, Emitter<FeedState> emit) async {
    final current = state;
    if (current is! FeedLoaded || !current.hasMore) return;
    await _fetch(emit, page: current.page + 1, reset: false);
  }

  Future<void> _onFilter(FeedFilterChanged event, Emitter<FeedState> emit) async {
    _activeType = event.type;
    _activeSource = event.source;
    emit(FeedLoading());
    await _fetch(emit, page: 1, reset: true);
  }

  Future<void> _fetch(Emitter<FeedState> emit, {required int page, required bool reset}) async {
    try {
      final params = <String, dynamic>{
        'page': page,
        'per_page': _pageSize,
      };
      if (_activeType != null) params['type'] = _activeType;
      if (_activeSource != null) params['source'] = _activeSource;

      final resp = await _api.dio.get('/opportunities', queryParameters: params);
      final body = resp.data;
      final rawList = body['opportunities'] as List? ?? [];
      final loaded = rawList
          .map((e) => Opportunity.fromJson(e as Map<String, dynamic>))
          .toList();

      final total = body['pagination']?['total'] as int? ?? 0;
      final fetched = (page - 1) * _pageSize + loaded.length;

      if (reset) {
        emit(FeedLoaded(
          opportunities: loaded,
          hasMore: fetched < total,
          page: page,
          activeType: _activeType,
          activeSource: _activeSource,
        ));
      } else {
        final current = state as FeedLoaded;
        emit(current.copyWith(
          opportunities: [...current.opportunities, ...loaded],
          hasMore: fetched < total,
          page: page,
        ));
      }
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] ?? 'Failed to load opportunities.';
      emit(FeedError(msg.toString()));
    } catch (e) {
      emit(FeedError('Something went wrong: ${e.toString()}'));
    }
  }
}
