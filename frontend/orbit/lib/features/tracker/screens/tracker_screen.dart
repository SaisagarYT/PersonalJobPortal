import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/models/application.dart';
import '../bloc/tracker_bloc.dart';
import '../bloc/tracker_event.dart';
import '../bloc/tracker_state.dart';

const _stages = ['saved', 'applied', 'interview', 'offer'];

const _stageLabels = {
  'saved': 'Saved',
  'applied': 'Applied',
  'interview': 'Interview',
  'offer': 'Offer',
};

const _stageColors = {
  'saved': AppColors.grey600,
  'applied': AppColors.navy,
  'interview': AppColors.purple,
  'offer': AppColors.green,
};

class TrackerScreen extends StatefulWidget {
  const TrackerScreen({super.key});

  @override
  State<TrackerScreen> createState() => _TrackerScreenState();
}

class _TrackerScreenState extends State<TrackerScreen> with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _stages.length, vsync: this);
    context.read<TrackerBloc>().add(TrackerLoadRequested());
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(children: [
          const Icon(Icons.view_kanban, color: AppColors.navy, size: 22),
          const SizedBox(width: 8),
          Text('Tracker', style: AppTextStyles.h3),
        ]),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_outlined),
            onPressed: () => context.read<TrackerBloc>().add(TrackerLoadRequested()),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabAlignment: TabAlignment.start,
          labelColor: AppColors.navy,
          unselectedLabelColor: AppColors.grey600,
          indicatorColor: AppColors.amber,
          indicatorWeight: 3,
          labelStyle: const TextStyle(fontFamily: 'SpaceGrotesk', fontSize: 13, fontWeight: FontWeight.w600),
          unselectedLabelStyle: const TextStyle(fontFamily: 'Inter', fontSize: 13),
          tabs: _stages.map((s) => BlocBuilder<TrackerBloc, TrackerState>(
            builder: (ctx, state) {
              int count = 0;
              if (state is TrackerLoaded) count = state.byStage(s).length;
              return Tab(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(_stageLabels[s]!),
                    if (count > 0) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: (_stageColors[s] ?? AppColors.navy).withAlpha(25),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          '$count',
                          style: TextStyle(
                            fontFamily: 'IBMPlexMono',
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            color: _stageColors[s] ?? AppColors.navy,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              );
            },
          )).toList(),
        ),
      ),
      body: BlocBuilder<TrackerBloc, TrackerState>(
        builder: (context, state) {
          if (state is TrackerLoading) {
            return const Center(child: CircularProgressIndicator());
          }
          if (state is TrackerError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 48, color: AppColors.red),
                  const SizedBox(height: 12),
                  Text(state.message, style: AppTextStyles.bodyMedium, textAlign: TextAlign.center),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => context.read<TrackerBloc>().add(TrackerLoadRequested()),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }
          if (state is TrackerLoaded) {
            return Column(
              children: [
                _SummaryBar(summary: state.summary, total: state.applications.length),
                Expanded(
                  child: TabBarView(
                    controller: _tabController,
                    children: _stages.map((s) => _StageColumn(
                      stage: s,
                      items: state.byStage(s),
                    )).toList(),
                  ),
                ),
              ],
            );
          }
          return const SizedBox();
        },
      ),
    );
  }
}

class _SummaryBar extends StatelessWidget {
  final Map<String, int> summary;
  final int total;
  const _SummaryBar({required this.summary, required this.total});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.white,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Expanded(
            child: Row(
              children: _stages.map((s) {
                final count = summary[s] ?? 0;
                final color = _stageColors[s] ?? AppColors.navy;
                return Expanded(
                  child: Column(
                    children: [
                      Text(
                        '$count',
                        style: TextStyle(
                          fontFamily: 'SpaceGrotesk',
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: color,
                        ),
                      ),
                      Text(
                        _stageLabels[s]!,
                        style: AppTextStyles.bodySmall.copyWith(color: AppColors.grey600, fontSize: 11),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
          Container(width: 1, height: 36, color: AppColors.border),
          const SizedBox(width: 12),
          Column(
            children: [
              Text(
                '$total',
                style: const TextStyle(
                  fontFamily: 'SpaceGrotesk',
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppColors.navy,
                ),
              ),
              Text('Total', style: AppTextStyles.bodySmall.copyWith(fontSize: 11)),
            ],
          ),
        ],
      ),
    );
  }
}

class _StageColumn extends StatelessWidget {
  final String stage;
  final List<Application> items;
  const _StageColumn({required this.stage, required this.items});

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              _stageIcon(stage),
              size: 48,
              color: (_stageColors[stage] ?? AppColors.grey400).withAlpha(80),
            ),
            const SizedBox(height: 12),
            Text(
              'No ${_stageLabels[stage]!.toLowerCase()} applications',
              style: AppTextStyles.bodyMedium.copyWith(color: AppColors.grey600),
            ),
          ],
        ),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.only(top: 8, bottom: 80),
      itemCount: items.length,
      itemBuilder: (context, i) => _KanbanCard(application: items[i], stage: stage),
    );
  }

  IconData _stageIcon(String s) {
    switch (s) {
      case 'saved': return Icons.bookmark_outline;
      case 'applied': return Icons.send_outlined;
      case 'interview': return Icons.chat_bubble_outline;
      case 'offer': return Icons.celebration_outlined;
      default: return Icons.work_outline;
    }
  }
}

class _KanbanCard extends StatelessWidget {
  final Application application;
  final String stage;
  const _KanbanCard({required this.application, required this.stage});

  @override
  Widget build(BuildContext context) {
    final opp = application.opportunity;
    final color = _stageColors[stage] ?? AppColors.navy;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Stage indicator strip
          Container(
            height: 4,
            decoration: BoxDecoration(
              color: color,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    // Company initial
                    Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: AppColors.surfaceVariant,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Center(
                        child: Text(
                          opp != null && opp.companyName.isNotEmpty
                              ? opp.companyName[0].toUpperCase()
                              : '?',
                          style: const TextStyle(
                            fontFamily: 'SpaceGrotesk',
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: AppColors.grey600,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            opp?.title ?? 'Application',
                            style: AppTextStyles.labelMedium.copyWith(
                              color: AppColors.navy,
                              fontWeight: FontWeight.w600,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            opp?.companyName ?? '—',
                            style: AppTextStyles.bodySmall,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    // Move-stage popup
                    _StageMoveButton(application: application, currentStage: stage),
                  ],
                ),
                if (opp != null) ...[
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      _Chip(
                        label: opp.locationDisplay,
                        icon: Icons.location_on_outlined,
                        color: AppColors.grey600,
                      ),
                      const SizedBox(width: 6),
                      _Chip(
                        label: opp.salaryDisplay,
                        icon: Icons.currency_rupee,
                        color: opp.compensation.isPaid ? AppColors.green : AppColors.grey600,
                      ),
                    ],
                  ),
                ],
                if (application.notes.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceVariant,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      application.notes,
                      style: AppTextStyles.bodySmall.copyWith(fontSize: 12),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
                if (application.rounds.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 6,
                    children: application.rounds.map((r) => _RoundChip(round: r)).toList(),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StageMoveButton extends StatelessWidget {
  final Application application;
  final String currentStage;
  const _StageMoveButton({required this.application, required this.currentStage});

  @override
  Widget build(BuildContext context) {
    final otherStages = _stages.where((s) => s != currentStage).toList();
    return PopupMenuButton<String>(
      icon: const Icon(Icons.more_vert, size: 18, color: AppColors.grey600),
      onSelected: (value) {
        if (value == '__delete__') {
          context.read<TrackerBloc>().add(TrackerApplicationDeleted(application.id));
        } else {
          context.read<TrackerBloc>().add(
            TrackerStageUpdated(applicationId: application.id, newStage: value),
          );
        }
      },
      itemBuilder: (_) => [
        ...otherStages.map((s) => PopupMenuItem<String>(
          value: s,
          child: Row(
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: _stageColors[s] ?? AppColors.navy,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 10),
              Text(
                'Move to ${_stageLabels[s]}',
                style: AppTextStyles.bodyMedium.copyWith(fontSize: 13),
              ),
            ],
          ),
        )),
        const PopupMenuDivider(),
        PopupMenuItem<String>(
          value: '__delete__',
          child: Row(
            children: [
              const Icon(Icons.delete_outline, size: 16, color: AppColors.red),
              const SizedBox(width: 10),
              Text('Delete', style: AppTextStyles.bodyMedium.copyWith(color: AppColors.red, fontSize: 13)),
            ],
          ),
        ),
      ],
    );
  }
}

class _RoundChip extends StatelessWidget {
  final InterviewRound round;
  const _RoundChip({required this.round});

  @override
  Widget build(BuildContext context) {
    final color = round.status == 'passed'
        ? AppColors.green
        : round.status == 'failed'
            ? AppColors.red
            : AppColors.purple;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withAlpha(20),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: color.withAlpha(60)),
      ),
      child: Text(
        round.roundName,
        style: AppTextStyles.bodySmall.copyWith(color: color, fontSize: 11),
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  const _Chip({required this.label, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withAlpha(18),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 4),
          Text(label, style: AppTextStyles.bodySmall.copyWith(color: color, fontSize: 11)),
        ],
      ),
    );
  }
}
