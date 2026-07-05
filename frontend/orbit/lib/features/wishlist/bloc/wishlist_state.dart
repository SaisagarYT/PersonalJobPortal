import '../../../shared/models/opportunity.dart';

abstract class WishlistState {}

class WishlistInitial extends WishlistState {}

class WishlistLoading extends WishlistState {}

class WishlistLoaded extends WishlistState {
  final List<Opportunity> items;
  final Set<String> savedIds;

  WishlistLoaded({required this.items, required this.savedIds});

  WishlistLoaded copyWith({List<Opportunity>? items, Set<String>? savedIds}) =>
      WishlistLoaded(
        items: items ?? this.items,
        savedIds: savedIds ?? this.savedIds,
      );
}

class WishlistError extends WishlistState {
  final String message;
  WishlistError(this.message);
}
