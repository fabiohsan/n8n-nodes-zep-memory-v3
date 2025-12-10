# Changelog

All notable changes to this project will be documented in this file.

## [0.3.0] - 2025-12-09

### ⚠️ BREAKING CHANGES

- **Removed Open Source Support**: This version only supports Zep Cloud v3
- **New SDK**: Migrated from `@langchain/community` to `@getzep/zep-cloud` native SDK
- **Simplified Credentials**: Removed "Cloud" toggle and "API URL" field

### Added

- **Context Block Output**: Returns structured USER_SUMMARY + FACTS from Zep's Knowledge Graph
- **Auto Thread Creation**: Automatically creates threads if they don't exist
- **Error Mapping**: User-friendly error messages for 401, 403, 404, 429, 500
- **Backward Compatibility**: `chat_history` still available as alias

### Changed

- **Output Format**: Now returns `{ context, messages, chat_history }`
- **Credentials**: Simplified to just API Key (required)
- **Logging**: Uses `this.logger` exclusively (no more console.log)

### Removed

- Support for Zep Open Source (deprecated by Zep in April 2025)
- `@langchain/community` dependency
- Console.log statements

### Technical Details

- Uses `@getzep/zep-cloud` v3.13.0 native SDK
- Implements `thread.getUserContext()` for Context Block
- Implements `thread.addMessages()` for saving context
- Node version 5 added for new implementation

## [0.2.3] - 2025-09-30

### Added
- Enhanced Console Logging for debugging
- Performance logging for memory operations

## [0.2.2] - 2025-09-30

### Changed
- Updated icon to PNG format
- Improved logging system

## [0.2.1] - 2025-09-30

### Added
- Enhanced logging with fallback support
- Better error messages

### Fixed
- Logging reliability in various environments

## [0.2.0] - 2025-09-30

### Changed
- Simplified logWrapper implementation
- Improved error handling

### Fixed
- Performance issues with excessive logging
- Potential memory leaks

## [0.1.0] - 2025-09-29

### Added
- Initial release
- Support for Zep Cloud and Open Source
- Thread-based memory management
- Message filtering