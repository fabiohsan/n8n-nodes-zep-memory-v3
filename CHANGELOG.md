# Changelog

All notable changes to this project will be documented in this file.

## [0.2.2] - 2024-09-30

### Changed
- **Updated Icon**: Replaced SVG icon with new PNG icon for better visual consistency

## [0.2.1] - 2024-09-30

### Added
- **Enhanced Logging System**: Robust logging helper with fallback support
- **Visual Log Messages**: Added emojis and better formatting for improved readability
- **Debug Information**: More detailed logging for troubleshooting and monitoring

### Changed
- **Removed logWrapper**: Eliminated complex proxy-based logging for better performance
- **Improved Error Messages**: More descriptive error messages with actionable guidance
- **Safer Logging**: Fallback to console.log when this.logger is unavailable

### Fixed
- **Logging Reliability**: Prevents crashes when logger is not available in certain environments
- **Performance**: Reduced overhead by removing proxy wrapper

### Technical Details
- Introduced safe logging helper function with try-catch protection
- Direct memory wrapper usage without proxy overhead
- Enhanced debugging capabilities for production environments

## [0.2.0] - 2024-09-30

### Changed
- **BREAKING**: Simplified logWrapper implementation using native n8n logger
- Removed complex logWrapper detection logic that was causing performance issues
- Improved error handling and logging consistency
- Cleaner, more maintainable codebase

### Fixed
- Resolved performance issues with excessive console logging
- Fixed potential memory leaks from complex proxy implementations
- Improved stability and reliability

### Technical Details
- Replaced complex logWrapper detection with direct `this.logger` usage
- Simplified proxy implementation for better performance
- Maintained full compatibility with existing workflows
- Reduced bundle size and complexity

## [0.1.0] - 2024-09-29

### Added
- Initial release of Zep Memory v3 community node
- Support for both Zep Cloud and Open Source instances
- Thread-based memory management (v3 terminology)
- Automatic message filtering (empty message removal)
- Multiple node versions for backward compatibility
- Full compatibility with discontinued official node

### Features
- Thread ID configuration with multiple input methods
- BaseChatMemoryWrapper for maximum compatibility
- WhiteSpaceTrimmedZepCloudMemory for message filtering
- Comprehensive error handling and validation
- TypeScript implementation with proper type safety