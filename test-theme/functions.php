<?php
if ( ! function_exists( 'block_base_theme' ) ) :
/**
 * Sets up theme defaults and registers support for various WordPress features.
 *
 * Note that this function is hooked into the after_setup_theme hook, which runs
 * before the init hook. The init hook is too late for some features, such as indicating
 * support post thumbnails.
 */
function block_base_theme() {
 
    /**
     * Add default posts and comments RSS feed links to <head>.
     */
    add_theme_support( 'automatic-feed-links' );
 
    /**
     * Enable support for post thumbnails and featured images.
     */
    add_theme_support( 'post-thumbnails' );
 
    add_theme_support( 'editor-color-palette', array(
        array(
            'name' => __( 'strong magenta', 'block_base_theme' ),
            'slug' => 'strong-magenta',
            'color' => '#a156b4',
        ),
        array(
            'name' => __( 'very dark gray', 'block_base_theme' ),
            'slug' => 'very-dark-gray',
            'color' => '#444',
        ),
    ) );
 
    add_theme_support( 'wp-block-styles' );
 
    add_theme_support( 'align-wide' );
}
endif; // block_base_theme
add_action( 'after_setup_theme', 'block_base_theme' );
 
/**
 * Enqueue theme scripts and styles.
 */
function block_base_theme_scripts() {
    wp_enqueue_style( 'block_base_theme-style', get_stylesheet_uri() );
 
    if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
        wp_enqueue_script( 'comment-reply' );
    }
}
add_action( 'wp_enqueue_scripts', 'block_base_theme_scripts' );