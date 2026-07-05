import '../../../shared/models/opportunity.dart';

abstract class FeedState {}

class FeedInitial extends FeedState {}

class FeedLoading extends FeedState {}

class FeedLoaded extends FeedState {
  final List<Opportunity> opportunities;
  final bool hasMore;
  final int page;
  final String? activeType;
  final String? activeSource;

  FeedLoaded({
    required this.opportunities,
    required this.hasMore,
    required this.page,
    this.activeType,
    this.activeSource,
  });

  FeedLoaded copyWith({
    List<Opportunity>? opportunities,
    bool? hasMore,
    int? page,
    String? activeType,
    String? activeSource,
  }) =>
      FeedLoaded(
        opportunities: opportunities ?? this.opportunities,
        hasMore: hasMore ?? this.hasMore,
        page: page ?? this.page,
        activeType: activeType ?? this.activeType,
        activeSource: activeSource ?? this.activeSource,
      );
}

class FeedError extends FeedState {
  final String message;
  FeedError(this.message);
}
