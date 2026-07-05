abstract class FeedEvent {}

class FeedLoadRequested extends FeedEvent {
  final bool refresh;
  FeedLoadRequested({this.refresh = false});
}

class FeedLoadMore extends FeedEvent {}

class FeedSearchChanged extends FeedEvent {
  final String query;
  FeedSearchChanged(this.query);
}

class FeedFilterChanged extends FeedEvent {
  final String? type;
  final String? source;
  final bool? isPaid;
  FeedFilterChanged({this.type, this.source, this.isPaid});
}
