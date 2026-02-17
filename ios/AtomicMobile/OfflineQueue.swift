import Foundation

@Observable @MainActor
final class OfflineQueue {
    var pending: [PendingAtom] = []

    private static var fileURL: URL {
        FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("pending_atoms.json")
    }

    init() {
        load()
    }

    func enqueue(content: String) {
        let atom = PendingAtom(
            id: UUID().uuidString,
            content: content,
            createdAt: Date()
        )
        pending.append(atom)
        persist()
    }

    func drain(api: APIClient) async {
        var remaining: [PendingAtom] = []
        for item in pending {
            do {
                _ = try await api.createAtom(content: item.content)
            } catch {
                remaining.append(item)
            }
        }
        pending = remaining
        persist()
    }

    private func persist() {
        try? JSONEncoder().encode(pending).write(to: Self.fileURL, options: .atomic)
    }

    private func load() {
        guard let data = try? Data(contentsOf: Self.fileURL) else { return }
        pending = (try? JSONDecoder().decode([PendingAtom].self, from: data)) ?? []
    }
}
