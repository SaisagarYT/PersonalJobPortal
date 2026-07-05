import 'package:flutter/material.dart';
import 'app_colors.dart';

class AppTextStyles {
  AppTextStyles._();

  // SpaceGrotesk — headings
  static const TextStyle h1 = TextStyle(
    fontFamily: 'SpaceGrotesk',
    fontSize: 28,
    fontWeight: FontWeight.w700,
    color: AppColors.navy,
    height: 1.2,
  );

  static const TextStyle h2 = TextStyle(
    fontFamily: 'SpaceGrotesk',
    fontSize: 22,
    fontWeight: FontWeight.w600,
    color: AppColors.navy,
    height: 1.3,
  );

  static const TextStyle h3 = TextStyle(
    fontFamily: 'SpaceGrotesk',
    fontSize: 18,
    fontWeight: FontWeight.w600,
    color: AppColors.navy,
    height: 1.3,
  );

  // Inter — body
  static const TextStyle bodyLarge = TextStyle(
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: FontWeight.w400,
    color: AppColors.grey800,
    height: 1.5,
  );

  static const TextStyle bodyMedium = TextStyle(
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: FontWeight.w400,
    color: AppColors.grey800,
    height: 1.5,
  );

  static const TextStyle bodySmall = TextStyle(
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: FontWeight.w400,
    color: AppColors.grey600,
    height: 1.4,
  );

  static const TextStyle labelMedium = TextStyle(
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: FontWeight.w500,
    color: AppColors.grey800,
    height: 1.4,
  );

  // IBM Plex Mono — numbers/tags
  static const TextStyle mono = TextStyle(
    fontFamily: 'IBMPlexMono',
    fontSize: 13,
    fontWeight: FontWeight.w400,
    color: AppColors.grey600,
  );

  static const TextStyle monoSm = TextStyle(
    fontFamily: 'IBMPlexMono',
    fontSize: 11,
    fontWeight: FontWeight.w400,
    color: AppColors.grey600,
  );
}
