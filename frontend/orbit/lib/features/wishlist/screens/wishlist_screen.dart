import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../bloc/wishlist_bloc.dart';
import '../bloc/wishlist_event.dart';
import '../bloc/wishlist_state.dart';
import '../../feed/widgets/opportunity_card.dart';
import '../../job_detail/screens/job_detail_screen.dart';

class WishlistScreen extends StatelessWidget {
  const WishlistScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(children: [
          const Icon(Icons.bookmark, color: AppColors.amber, size: 22),
          const SizedBox(width: 8),
          Text('Saved Jobs', style: AppTextStyles.h3),
        ]),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_outlined),
            onPressed: () => context.read<WishlistBloc>().add(WishlistLoadRequested()),
          ),
        ],
      ),
      body: BlocBuilder<WishlistBloc, WishlistState>(
        builder: (context, state) {
          if (state is WishlistLoading) {
            return const Center(child: CircularProgressIndicator());
          }
          if (state is WishlistError) {
            return _ErrorView(
              message: state.message,
              onRetry: () => context.read<WishlistBloc>().add(WishlistLoadRequested()),
            );
          }
          if (state is WishlistLoaded) {
            if (state.items.isEmpty) return const _EmptyView();
            return RefreshIndicator(
              onRefresh: () async =>
                  context.read<WishlistBloc>().add(WishlistLoadRequested()),
              child: ListView.builder(
                padding: const EdgeInsets.only(top: 8, bottom: 80),
                itemCount: state.items.length,
                itemBuilder: (context, i) {
                  final opp = state.items[i];
                  return OpportunityCard(
                    opportunity: opp,
                    isSaved: true,
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => JobDetailScreen(opportunity: opp)),
                    ),
                    onSave: () => context
                        .read<WishlistBloc>()
                        .add(WishlistRemoveRequested(opp.id)),
                  );
                },
              ),
            );
          }
          return const SizedBox();
        },
      ),
    );
  }
}

class _EmptyView extends StatelessWidget {
  const _EmptyView();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.amber.withAlpha(20),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.bookmark_outline, size: 48, color: AppColors.amber),
          ),
          const SizedBox(height: 20),
          Text('No saved jobs yet', style: AppTextStyles.h3),
          const SizedBox(height: 8),
          Text(
            'Tap the bookmark on any opportunity\nto save it here.',
            style: AppTextStyles.bodyMedium.copyWith(color: AppColors.grey600),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _ErrorView({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 48, color: AppColors.red),
          const SizedBox(height: 12),
          Text(message, style: AppTextStyles.bodyMedium, textAlign: TextAlign.center),
          const SizedBox(height: 16),
          ElevatedButton(onPressed: onRetry, child: const Text('Retry')),
        ],
      ),
    );
  }
}
