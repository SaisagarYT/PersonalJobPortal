import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/models/opportunity.dart';

class JobDetailScreen extends StatelessWidget {
  final Opportunity opportunity;

  const JobDetailScreen({super.key, required this.opportunity});

  @override
  Widget build(BuildContext context) {
    final o = opportunity;
    return Scaffold(
      appBar: AppBar(
        title: Text(o.companyName.isNotEmpty ? o.companyName : 'Details'),
        actions: [
          IconButton(icon: const Icon(Icons.open_in_new), onPressed: () {}),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: AppColors.surfaceVariant,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Center(
                      child: Text(
                        o.companyName.isNotEmpty ? o.companyName[0].toUpperCase() : '?',
                        style: const TextStyle(
                          fontFamily: 'SpaceGrotesk',
                          fontSize: 24,
                          fontWeight: FontWeight.w700,
                          color: AppColors.navy,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(o.title, style: AppTextStyles.h3),
                        const SizedBox(height: 4),
                        Text(o.companyName, style: AppTextStyles.bodyMedium.copyWith(color: AppColors.grey600)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Quick stats
            _infoGrid(o),
            const SizedBox(height: 20),

            // Apply button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.send, size: 18),
                label: const Text('Apply Now'),
              ),
            ),
            const SizedBox(height: 20),

            // Description
            if (o.description.isNotEmpty) ...[
              Text('About this role', style: AppTextStyles.h3),
              const SizedBox(height: 10),
              Text(o.description, style: AppTextStyles.bodyMedium),
              const SizedBox(height: 20),
            ],

            // Skills
            if (o.skills.isNotEmpty) ...[
              Text('Skills Required', style: AppTextStyles.h3),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: o.skills.map((s) => Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.navy.withAlpha(15),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: AppColors.navy.withAlpha(40)),
                  ),
                  child: Text(s, style: AppTextStyles.labelMedium.copyWith(color: AppColors.navy)),
                )).toList(),
              ),
              const SizedBox(height: 20),
            ],

            // Timeline section
            Text('Timeline', style: AppTextStyles.h3),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                children: [
                  _timelineRow(
                    icon: Icons.calendar_today_outlined,
                    label: 'Posted Date',
                    value: Opportunity.fmtDate(o.postedDate),
                    color: AppColors.navy,
                  ),
                  const Divider(height: 16),
                  _timelineRow(
                    icon: Icons.download_outlined,
                    label: 'Scraped Date',
                    value: Opportunity.fmtDate(o.fetchedAt),
                    color: AppColors.grey600,
                  ),
                  if (o.deadline != null && o.deadline!.isNotEmpty) ...[
                    const Divider(height: 16),
                    _timelineRow(
                      icon: Icons.event_busy_outlined,
                      label: 'Application Deadline',
                      value: Opportunity.fmtDate(o.deadline),
                      color: AppColors.red,
                    ),
                  ],
                  const Divider(height: 16),
                  _timelineRow(
                    icon: Icons.update_outlined,
                    label: 'Last Updated',
                    value: Opportunity.fmtDate(o.lastUpdated),
                    color: AppColors.grey600,
                    isLast: true,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 80),
          ],
        ),
      ),
    );
  }

  Widget _timelineRow({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
    bool isLast = false,
  }) {
    return Row(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: color.withAlpha(20),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, size: 16, color: color),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label,
                  style: AppTextStyles.bodySmall.copyWith(color: AppColors.grey400, fontSize: 11)),
              const SizedBox(height: 2),
              Text(value,
                  style: AppTextStyles.labelMedium.copyWith(
                      color: value == '—' ? AppColors.grey400 : color)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _infoGrid(Opportunity o) {
    final items = [
      _InfoItem(icon: Icons.currency_rupee, label: 'Stipend', value: o.salaryDisplay),
      _InfoItem(icon: Icons.location_on_outlined, label: 'Location', value: o.locationDisplay),
      _InfoItem(
        icon: Icons.calendar_month_outlined,
        label: 'Duration',
        value: o.durationValue > 0 ? '${o.durationValue} ${o.durationUnit}' : 'N/A',
      ),
      _InfoItem(icon: Icons.people_outline, label: 'Applicants', value: o.applicantsCount.toString()),
    ];
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 2.5,
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
      children: items.map((item) => Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Row(
              children: [
                Icon(item.icon, size: 13, color: AppColors.grey600),
                const SizedBox(width: 4),
                Text(item.label, style: AppTextStyles.bodySmall),
              ],
            ),
            const SizedBox(height: 2),
            Text(item.value, style: AppTextStyles.labelMedium.copyWith(color: AppColors.navy)),
          ],
        ),
      )).toList(),
    );
  }
}

class _InfoItem {
  final IconData icon;
  final String label;
  final String value;
  const _InfoItem({required this.icon, required this.label, required this.value});
}
