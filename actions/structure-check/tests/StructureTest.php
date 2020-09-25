<?php declare(strict_types=1);
use PHPUnit\Framework\TestCase;
final class StructureTest extends TestCase
{
    const REL_THEME_LOCATION = '../../test-theme';

    public function testsThatStyleIsPresent(): void
    {
        $this->assertFileExists( self::REL_THEME_LOCATION . '/style.css', '::error:: We require you have a style.css file.' );
    }

    public function testsThatIndexIsPresent(): void
    {
        $this->assertFileExists( self::REL_THEME_LOCATION . '/index.php', '::error::We require you have a index.php file.' );
    }

    public function testsThatCommentsIsPresent(): void
    {
        $this->assertFileExists( self::REL_THEME_LOCATION . '/comments.php', '::error::We require you have a comments.php file.' );
    }

    public function testsThatScreenshotIsPresent(): void
    {
        $this->assertFileExists( self::REL_THEME_LOCATION . '/screenshot.png', '::error::We require you have a screenshot.png file.' );
    }
}