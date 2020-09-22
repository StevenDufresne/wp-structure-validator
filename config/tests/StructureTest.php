<?php declare(strict_types=1);
use PHPUnit\Framework\TestCase;
final class StructureTest extends TestCase
{
    public function testsThatStyleIsPresent(): void
    {
        $this->assertFileExists( './test-theme/style.css', '::error:: We require you have a style.css file.' );
    }

    public function testsThatIndexIsPresent(): void
    {
        $this->assertFileExists( './test-theme/index.php', '::error::We require you have a index.php file.' );
    }

    public function testsThatCommentsIsPresent(): void
    {
        $this->assertFileExists( './test-theme/comments.php', 'We require you have a comments.php file.' );
    }

    public function testsThatScreenshotIsPresent(): void
    {
        $this->assertFileExists( './test-theme/screenshot.png', 'We require you have a screenshot.png file.' );
    }
}
