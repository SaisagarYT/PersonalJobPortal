import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/models/user_profile.dart';
import '../bloc/profile_bloc.dart';
import '../bloc/profile_event.dart';
import '../bloc/profile_state.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<ProfileBloc, ProfileState>(
      builder: (context, state) {
        if (state is ProfileLoading) {
          return const Scaffold(body: Center(child: CircularProgressIndicator()));
        }
        if (state is ProfileError) {
          return Scaffold(
            appBar: AppBar(title: Text('Profile', style: AppTextStyles.h3)),
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 48, color: AppColors.red),
                  const SizedBox(height: 12),
                  Text(state.message, style: AppTextStyles.bodyMedium),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => context.read<ProfileBloc>().add(ProfileLoadRequested()),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            ),
          );
        }
        if (state is ProfileLoaded) {
          return _ProfileView(profile: state.profile, saving: state.saving);
        }
        return const Scaffold(body: Center(child: CircularProgressIndicator()));
      },
    );
  }
}

class _ProfileView extends StatefulWidget {
  final UserProfile profile;
  final bool saving;
  const _ProfileView({required this.profile, required this.saving});

  @override
  State<_ProfileView> createState() => _ProfileViewState();
}

class _ProfileViewState extends State<_ProfileView> {
  late final TextEditingController _nameCtrl;
  late final TextEditingController _roleCtrl;
  late final TextEditingController _locationCtrl;
  late final TextEditingController _skillsCtrl;
  bool _editing = false;

  @override
  void initState() {
    super.initState();
    _nameCtrl = TextEditingController(text: widget.profile.name);
    _roleCtrl = TextEditingController(text: widget.profile.currentRole);
    _locationCtrl = TextEditingController(text: widget.profile.location);
    _skillsCtrl = TextEditingController(text: widget.profile.skills.join(', '));
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _roleCtrl.dispose();
    _locationCtrl.dispose();
    _skillsCtrl.dispose();
    super.dispose();
  }

  void _save() {
    final skills = _skillsCtrl.text
        .split(',')
        .map((s) => s.trim())
        .where((s) => s.isNotEmpty)
        .toList();
    context.read<ProfileBloc>().add(ProfileUpdateRequested(
          name: _nameCtrl.text.trim(),
          currentRole: _roleCtrl.text.trim(),
          location: _locationCtrl.text.trim(),
          skills: skills,
        ));
    setState(() => _editing = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(children: [
          const Icon(Icons.person, color: AppColors.navy, size: 22),
          const SizedBox(width: 8),
          Text('Profile', style: AppTextStyles.h3),
        ]),
        actions: [
          if (!_editing)
            TextButton.icon(
              onPressed: () => setState(() => _editing = true),
              icon: const Icon(Icons.edit_outlined, size: 16),
              label: const Text('Edit'),
            )
          else
            Row(
              children: [
                TextButton(
                  onPressed: () => setState(() => _editing = false),
                  child: const Text('Cancel'),
                ),
                widget.saving
                    ? const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 16),
                        child: SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                      )
                    : TextButton(
                        onPressed: _save,
                        child: Text(
                          'Save',
                          style: TextStyle(
                            color: AppColors.amber,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
              ],
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Avatar + name section
            _AvatarHeader(profile: widget.profile),
            const SizedBox(height: 24),

            // Identity card
            _SectionCard(
              title: 'Identity',
              icon: Icons.badge_outlined,
              child: _editing
                  ? Column(
                      children: [
                        _Field(label: 'Full Name', controller: _nameCtrl),
                        const SizedBox(height: 12),
                        _Field(label: 'Current Role', controller: _roleCtrl),
                        const SizedBox(height: 12),
                        _Field(label: 'Location', controller: _locationCtrl),
                      ],
                    )
                  : Column(
                      children: [
                        _InfoRow(label: 'Name', value: widget.profile.name.isNotEmpty ? widget.profile.name : '—'),
                        _InfoRow(label: 'Role', value: widget.profile.currentRole.isNotEmpty ? widget.profile.currentRole : '—'),
                        _InfoRow(label: 'Location', value: widget.profile.location.isNotEmpty ? widget.profile.location : '—'),
                        _InfoRow(label: 'Email', value: widget.profile.email, last: true),
                      ],
                    ),
            ),
            const SizedBox(height: 16),

            // Skills card
            _SectionCard(
              title: 'Skills',
              icon: Icons.code_outlined,
              child: _editing
                  ? Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _Field(
                          label: 'Skills (comma-separated)',
                          controller: _skillsCtrl,
                          maxLines: 3,
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'e.g. Flutter, Dart, Node.js, PostgreSQL',
                          style: AppTextStyles.bodySmall.copyWith(color: AppColors.grey400),
                        ),
                      ],
                    )
                  : widget.profile.skills.isEmpty
                      ? Text('No skills added yet.', style: AppTextStyles.bodyMedium.copyWith(color: AppColors.grey600))
                      : Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: widget.profile.skills.map((s) => _SkillPill(skill: s)).toList(),
                        ),
            ),
            const SizedBox(height: 16),

            // Account actions
            _SectionCard(
              title: 'Account',
              icon: Icons.settings_outlined,
              child: Column(
                children: [
                  _ActionRow(
                    icon: Icons.notifications_outlined,
                    label: 'Notifications',
                    onTap: () {},
                  ),
                  const Divider(height: 1),
                  _ActionRow(
                    icon: Icons.privacy_tip_outlined,
                    label: 'Privacy & Data',
                    onTap: () {},
                  ),
                  const Divider(height: 1),
                  _ActionRow(
                    icon: Icons.logout,
                    label: 'Sign Out',
                    color: AppColors.red,
                    onTap: () => _confirmLogout(context),
                    last: true,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 40),

            // Footer
            Center(
              child: Text(
                'Orbit — Personal Career OS',
                style: AppTextStyles.bodySmall.copyWith(color: AppColors.grey400),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  void _confirmLogout(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('Sign Out', style: AppTextStyles.h3),
        content: Text('Are you sure you want to sign out?', style: AppTextStyles.bodyMedium),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              context.read<ProfileBloc>().add(ProfileLogoutRequested());
            },
            child: Text('Sign Out', style: TextStyle(color: AppColors.red)),
          ),
        ],
      ),
    );
  }
}

class _AvatarHeader extends StatelessWidget {
  final UserProfile profile;
  const _AvatarHeader({required this.profile});

  @override
  Widget build(BuildContext context) {
    final initials = profile.name.isNotEmpty
        ? profile.name.trim().split(' ').map((w) => w.isNotEmpty ? w[0] : '').take(2).join().toUpperCase()
        : profile.email.isNotEmpty ? profile.email[0].toUpperCase() : 'U';

    return Row(
      children: [
        Container(
          width: 72,
          height: 72,
          decoration: BoxDecoration(
            color: AppColors.navy,
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text(
              initials,
              style: const TextStyle(
                fontFamily: 'SpaceGrotesk',
                fontSize: 28,
                fontWeight: FontWeight.w700,
                color: AppColors.amber,
              ),
            ),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                profile.name.isNotEmpty ? profile.name : 'Your Name',
                style: AppTextStyles.h2,
              ),
              const SizedBox(height: 4),
              if (profile.currentRole.isNotEmpty)
                Text(
                  profile.currentRole,
                  style: AppTextStyles.bodyMedium.copyWith(color: AppColors.grey600),
                ),
              const SizedBox(height: 4),
              Text(
                profile.email,
                style: AppTextStyles.bodySmall.copyWith(color: AppColors.grey400),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _SectionCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final Widget child;
  const _SectionCard({required this.title, required this.icon, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
            child: Row(
              children: [
                Icon(icon, size: 16, color: AppColors.navy),
                const SizedBox(width: 8),
                Text(title, style: AppTextStyles.labelMedium.copyWith(color: AppColors.navy, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
          const Divider(height: 1),
          Padding(padding: const EdgeInsets.all(16), child: child),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  final bool last;
  const _InfoRow({required this.label, required this.value, this.last = false});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: last ? 0 : 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(label, style: AppTextStyles.bodySmall.copyWith(color: AppColors.grey400)),
          ),
          Expanded(
            child: Text(value, style: AppTextStyles.bodyMedium.copyWith(color: AppColors.navy)),
          ),
        ],
      ),
    );
  }
}

class _Field extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final int maxLines;
  const _Field({required this.label, required this.controller, this.maxLines = 1});

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      maxLines: maxLines,
      decoration: InputDecoration(labelText: label),
    );
  }
}

class _SkillPill extends StatelessWidget {
  final String skill;
  const _SkillPill({required this.skill});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: AppColors.navy.withAlpha(12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.navy.withAlpha(40)),
      ),
      child: Text(
        skill,
        style: AppTextStyles.bodySmall.copyWith(
          color: AppColors.navy,
          fontSize: 12,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}

class _ActionRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color? color;
  final VoidCallback onTap;
  final bool last;
  const _ActionRow({required this.icon, required this.label, required this.onTap, this.color, this.last = false});

  @override
  Widget build(BuildContext context) {
    final c = color ?? AppColors.navy;
    return InkWell(
      onTap: onTap,
      borderRadius: last
          ? const BorderRadius.only(bottomLeft: Radius.circular(12), bottomRight: Radius.circular(12))
          : BorderRadius.zero,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Row(
          children: [
            Icon(icon, size: 20, color: c),
            const SizedBox(width: 12),
            Expanded(child: Text(label, style: AppTextStyles.bodyMedium.copyWith(color: c))),
            Icon(Icons.chevron_right, size: 18, color: AppColors.grey400),
          ],
        ),
      ),
    );
  }
}
