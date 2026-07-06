import '../../../shared/models/opportunity.dart';

abstract class WishlistEvent {}

class WishlistLoadRequested extends WishlistEvent {}

class WishlistSaveRequested extends WishlistEvent {
  final String opportunityId;
  final Opportunity opportunity;
  WishlistSaveRequested(this.opportunityId, this.opportunity);
}

class WishlistRemoveRequested extends WishlistEvent {
  final String opportunityId;
  WishlistRemoveRequested(this.opportunityId);
}
