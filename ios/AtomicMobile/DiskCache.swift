import Foundation

struct DiskCache: Sendable {
    private static var cacheDirectory: URL {
        FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("AtomicCache", isDirectory: true)
    }

    func save<T: Encodable>(_ value: T, forKey key: String) {
        let dir = Self.cacheDirectory
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let file = dir.appendingPathComponent("\(key).json")
        try? JSONEncoder().encode(value).write(to: file, options: .atomic)
    }

    func load<T: Decodable>(_ type: T.Type, forKey key: String) -> T? {
        let file = Self.cacheDirectory.appendingPathComponent("\(key).json")
        guard let data = try? Data(contentsOf: file) else { return nil }
        return try? JSONDecoder().decode(type, from: data)
    }
}
