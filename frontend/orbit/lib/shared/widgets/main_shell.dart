import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../features/feed/bloc/feed_bloc.dart';
import '../../features/feed/screens/feed_screen.dart';
import '../../features/wishlist/bloc/wishlist_bloc.dart';
import '../../features/wishlist/bloc/wishlist_event.dart';
import '../../features/wishlist/screens/wishlist_screen.dart';
import '../../features/tracker/bloc/tracker_bloc.dart';
import '../../features/tracker/bloc/tracker_event.dart';
import '../../features/tracker/screens/tracker_screen.dart';
import '../../features/profile/bloc/profile_bloc.dart';
import '../../features/profile/bloc/profile_event.dart';
import '../../features/profile/screens/profile_screen.dart';
import '../../features/auth/bloc/auth_bloc.dart';

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

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider(create: (_) => FeedBloc()),
        BlocProvider(create: (_) => WishlistBloc()..add(WishlistLoadRequested())),
        BlocProvider(create: (_) => TrackerBloc()),
        BlocProvider(
          create: (ctx) => ProfileBloc(authBloc: ctx.read<AuthBloc>())
            ..add(ProfileLoadRequested()),
        ),
      ],
      child: Scaffold(
        body: IndexedStack(
          index: _currentIndex,
          children: const [
            FeedScreen(),
            WishlistScreen(),
            TrackerScreen(),
            ProfileScreen(),
          ],
        ),
        bottomNavigationBar: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (i) {
            setState(() => _currentIndex = i);
            // Reload tracker on tab switch so it's always fresh
            if (i == 2) {
              context.read<TrackerBloc>().add(TrackerLoadRequested());
            }
          },
          items: _tabs
              .map((t) => BottomNavigationBarItem(
                    icon: Icon(t.icon),
                    activeIcon: Icon(t.activeIcon),
                    label: t.label,
                  ))
              .toList(),
        ),
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
