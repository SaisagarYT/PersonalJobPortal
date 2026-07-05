abstract class WishlistEvent {}

class WishlistLoadRequested extends WishlistEvent {}

class WishlistSaveRequested extends WishlistEvent {
  final String opportunityId;
  WishlistSaveRequested(this.opportunityId);
}

class WishlistRemoveRequested extends WishlistEvent {
  final String opportunityId;
  WishlistRemoveRequested(this.opportunityId);
}
