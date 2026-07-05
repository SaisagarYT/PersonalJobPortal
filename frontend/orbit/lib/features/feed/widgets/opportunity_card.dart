import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/models/opportunity.dart';

class OpportunityCard extends StatelessWidget {
  final Opportunity opportunity;
  final VoidCallback? onTap;
  final VoidCallback? onSave;
  final bool isSaved;

  const OpportunityCard({
    super.key,
    required this.opportunity,
    this.onTap,
    this.onSave,
    this.isSaved = false,
  });

  Color _sourceColor(String source) {
    switch (source.toLowerCase()) {
      case 'unstop':
        return const Color(0xFF4B5FFF);
      case 'internshala':
        return const Color(0xFF00B96B);
      case 'apna':
        return const Color(0xFFFF6B35);
      default:
        return AppColors.grey600;
    }
  }

  @override
  Widget build(BuildContext context) {
    final o = opportunity;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header row: logo + company + source badge + save
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: AppColors.surfaceVariant,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: o.companyLogo.isNotEmpty
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.network(
                            o.companyLogo,
                            fit: BoxFit.cover,
                            errorBuilder: (context, err, stack) => _companyInitial(o.companyName),
                          ),
                        )
                      : _companyInitial(o.companyName),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        o.companyName.isNotEmpty ? o.companyName : 'Company',
                        style: AppTextStyles.labelMedium,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      // Source badge — intrinsic width, won't overflow
                      IntrinsicWidth(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(
                            color: _sourceColor(o.source).withAlpha(26),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            o.source.toUpperCase(),
                            style: AppTextStyles.monoSm.copyWith(
                              color: _sourceColor(o.source),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 4),
                GestureDetector(
                  onTap: onSave,
                  child: Padding(
                    padding: const EdgeInsets.all(4),
                    child: Icon(
                      isSaved ? Icons.bookmark : Icons.bookmark_outline,
                      color: isSaved ? AppColors.amber : AppColors.grey400,
                      size: 22,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),

            // Title
            Text(
              o.title,
              style: AppTextStyles.h3.copyWith(fontSize: 16),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 8),

            // Chips — Wrap so they never overflow horizontally
            Wrap(
              spacing: 6,
              runSpacing: 4,
              children: [
                _chip(
                  o.type == 'job' ? 'Full-time' : o.type.toUpperCase(),
                  icon: Icons.work_outline,
                  color: o.type == 'internship' ? AppColors.purple : AppColors.navy,
                ),
                _chip(
                  o.salaryDisplay,
                  icon: Icons.currency_rupee,
                  color: o.compensation.isPaid ? AppColors.green : AppColors.grey600,
                ),
                if (o.locationDisplay.isNotEmpty)
                  _chip(
                    o.locationDisplay,
                    icon: Icons.location_on_outlined,
                    color: AppColors.grey600,
                  ),
              ],
            ),

            // Skills — Wrap instead of horizontal ListView to avoid overflow
            if (o.skills.isNotEmpty) ...[
              const SizedBox(height: 8),
              Wrap(
                spacing: 6,
                runSpacing: 4,
                children: o.skills.take(5).map((s) => Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceVariant,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    s,
                    style: AppTextStyles.bodySmall.copyWith(fontSize: 11),
                  ),
                )).toList(),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _companyInitial(String name) {
    return Center(
      child: Text(
        name.isNotEmpty ? name[0].toUpperCase() : '?',
        style: const TextStyle(
          fontFamily: 'SpaceGrotesk',
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: AppColors.grey600,
        ),
      ),
    );
  }

  Widget _chip(String label, {required IconData icon, required Color color}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withAlpha(20),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 4),
          Flexible(
            child: Text(
              label,
              style: AppTextStyles.bodySmall.copyWith(color: color, fontSize: 12),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
