import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../bloc/feed_bloc.dart';
import '../bloc/feed_event.dart';
import '../bloc/feed_state.dart';
import '../widgets/opportunity_card.dart';
import '../../job_detail/screens/job_detail_screen.dart';
import '../../wishlist/bloc/wishlist_bloc.dart';
import '../../wishlist/bloc/wishlist_event.dart';
import '../../wishlist/bloc/wishlist_state.dart';

class FeedScreen extends StatefulWidget {
  const FeedScreen({super.key});

  @override
  State<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  static const _types = ['All', 'Internship', 'Job', 'Competition'];
  static const _sources = ['All', 'Unstop', 'Internshala', 'Apna'];
  int _typeIdx = 0;

  @override
  void initState() {
    super.initState();
    context.read<FeedBloc>().add(FeedLoadRequested());
  }

  void _onScrollNotification(ScrollNotification notification) {
    if (notification is ScrollEndNotification &&
        notification.metrics.pixels >= notification.metrics.maxScrollExtent - 200) {
      context.read<FeedBloc>().add(FeedLoadMore());
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) => [
          SliverAppBar(
            floating: true,
            snap: true,
            backgroundColor: AppColors.paper,
            title: Row(children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: AppColors.navy,
                  borderRadius: BorderRadius.circular(7),
                ),
                child: const Center(
                  child: Text('O',
                      style: TextStyle(
                          fontFamily: 'SpaceGrotesk',
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: AppColors.amber)),
                ),
              ),
              const SizedBox(width: 8),
              Text('Orbit', style: AppTextStyles.h3),
            ]),
            actions: [
              IconButton(
                icon: const Icon(Icons.search),
                onPressed: () {},
              ),
              IconButton(
                icon: const Icon(Icons.filter_list),
                onPressed: () => _showFilters(context),
              ),
            ],
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(48),
              child: SizedBox(
                height: 48,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  itemCount: _types.length,
                  separatorBuilder: (context, index) => const SizedBox(width: 8),
                  itemBuilder: (_, i) => GestureDetector(
                    onTap: () {
                      setState(() => _typeIdx = i);
                      final type = i == 0 ? null : _types[i].toLowerCase();
                      context.read<FeedBloc>().add(FeedFilterChanged(type: type));
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                      decoration: BoxDecoration(
                        color: _typeIdx == i ? AppColors.navy : AppColors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: _typeIdx == i ? AppColors.navy : AppColors.border,
                        ),
                      ),
                      child: Text(
                        _types[i],
                        style: AppTextStyles.labelMedium.copyWith(
                          color: _typeIdx == i ? AppColors.white : AppColors.grey600,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
        body: BlocBuilder<FeedBloc, FeedState>(
          builder: (context, state) {
            if (state is FeedLoading) {
              return const Center(child: CircularProgressIndicator());
            }
            if (state is FeedError) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.error_outline, size: 48, color: AppColors.red),
                    const SizedBox(height: 12),
                    Text(state.message, style: AppTextStyles.bodyMedium, textAlign: TextAlign.center),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () => context.read<FeedBloc>().add(FeedLoadRequested()),
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              );
            }
            if (state is FeedLoaded) {
              if (state.opportunities.isEmpty) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.search_off, size: 48, color: AppColors.grey400),
                      const SizedBox(height: 12),
                      Text('No opportunities found', style: AppTextStyles.bodyMedium),
                    ],
                  ),
                );
              }
              return RefreshIndicator(
                onRefresh: () async =>
                    context.read<FeedBloc>().add(FeedLoadRequested(refresh: true)),
                // NotificationListener handles load-more — no custom ScrollController
                // needed, so NestedScrollView can manage the SliverAppBar correctly.
                child: NotificationListener<ScrollNotification>(
                  onNotification: (n) {
                    _onScrollNotification(n);
                    return false;
                  },
                  child: ListView.builder(
                    padding: const EdgeInsets.only(top: 8, bottom: 80),
                    itemCount: state.opportunities.length + (state.hasMore ? 1 : 0),
                    itemBuilder: (context, i) {
                      if (i == state.opportunities.length) {
                        return const Padding(
                          padding: EdgeInsets.all(16),
                          child: Center(child: CircularProgressIndicator()),
                        );
                      }
                      final opp = state.opportunities[i];
                      // Rebuild this card whenever the wishlist state changes so
                      // the bookmark icon always reflects the correct saved state.
                      return BlocBuilder<WishlistBloc, WishlistState>(
                        builder: (ctx, wState) {
                          final saved = wState is WishlistLoaded &&
                              wState.savedIds.contains(opp.id);
                          return OpportunityCard(
                            opportunity: opp,
                            isSaved: saved,
                            onTap: () => Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) => JobDetailScreen(opportunity: opp),
                              ),
                            ),
                            onSave: () {
                              final wb = ctx.read<WishlistBloc>();
                              if (saved) {
                                wb.add(WishlistRemoveRequested(opp.id));
                              } else {
                                wb.add(WishlistSaveRequested(opp.id));
                              }
                            },
                          );
                        },
                      );
                    },
                  ),
                ),
              );
            }
            return const SizedBox();
          },
        ),
      ),
    );
  }

  void _showFilters(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) {
        int srcIdx = 0;
        return StatefulBuilder(
          builder: (ctx, setSt) => Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Filter by Source', style: AppTextStyles.h3),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 8,
                  children: List.generate(
                    _sources.length,
                    (i) => ChoiceChip(
                      label: Text(_sources[i]),
                      selected: srcIdx == i,
                      onSelected: (_) => setSt(() => srcIdx = i),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      final src = srcIdx == 0 ? null : _sources[srcIdx].toLowerCase();
                      context.read<FeedBloc>().add(FeedFilterChanged(source: src));
                      Navigator.pop(context);
                    },
                    child: const Text('Apply'),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
