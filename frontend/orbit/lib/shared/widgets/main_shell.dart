import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../features/feed/bloc/feed_bloc.dart';
import '../../features/feed/screens/feed_screen.dart';
import '../../core/theme/app_colors.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _currentIndex = 0;

  static const _tabs = [
    _Tab(icon: Icons.explore_outlined, activeIcon: Icons.explore, label: 'Explore'),
    _Tab(icon: Icons.bookmark_outline, activeIcon: Icons.bookmark, label: 'Saved'),
    _Tab(icon: Icons.view_kanban_outlined, activeIcon: Icons.view_kanban, label: 'Tracker'),
    _Tab(icon: Icons.person_outline, activeIcon: Icons.person, label: 'Profile'),
  ];

  Widget _buildPage(int index) {
    switch (index) {
      case 0:
        return BlocProvider(
          create: (_) => FeedBloc(),
          child: const FeedScreen(),
        );
      case 1:
        return const _PlaceholderPage(title: 'Saved', icon: Icons.bookmark_outline);
      case 2:
        return const _PlaceholderPage(title: 'Tracker', icon: Icons.view_kanban_outlined);
      case 3:
        return const _PlaceholderPage(title: 'Profile', icon: Icons.person_outline);
      default:
        return const SizedBox();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: List.generate(4, _buildPage),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (i) => setState(() => _currentIndex = i),
        items: _tabs.map((t) => BottomNavigationBarItem(
          icon: Icon(t.icon),
          activeIcon: Icon(t.activeIcon),
          label: t.label,
        )).toList(),
      ),
    );
  }
}

class _Tab {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  const _Tab({required this.icon, required this.activeIcon, required this.label});
}

class _PlaceholderPage extends StatelessWidget {
  final String title;
  final IconData icon;

  const _PlaceholderPage({required this.title, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 56, color: AppColors.grey400),
            const SizedBox(height: 12),
            Text(
              '$title coming soon',
              style: const TextStyle(
                fontFamily: 'Inter',
                fontSize: 16,
                color: AppColors.grey600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
