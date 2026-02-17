import SwiftUI

struct ComposeView: View {
    let store: AtomStore
    let editingAtom: Atom?
    let onSave: () async -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var content = ""
    @State private var isSaving = false

    init(store: AtomStore, editing atom: Atom? = nil, onSave: @escaping () async -> Void) {
        self.store = store
        self.editingAtom = atom
        self.onSave = onSave
    }

    init(api: APIClient, editing atom: Atom? = nil, onSave: @escaping () async -> Void) {
        self.store = AtomStore(api: api)
        self.editingAtom = atom
        self.onSave = onSave
    }

    private var isEditing: Bool { editingAtom != nil }
    private var title: String { isEditing ? "Edit Atom" : "New Atom" }
    private var canSave: Bool {
        !content.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !isSaving
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.bg.ignoresSafeArea()

                MarkdownTextView(text: $content)
            }
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(Theme.bg, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                        .tint(Theme.textSecondary)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        Task { await save() }
                    } label: {
                        if isSaving {
                            ProgressView()
                                .tint(Theme.accent)
                        } else {
                            Text("Save")
                                .fontWeight(.semibold)
                        }
                    }
                    .tint(Theme.accent)
                    .disabled(!canSave)
                }
            }
            .onAppear {
                if let editingAtom {
                    content = editingAtom.content
                }
            }
        }
        .presentationBackground(Theme.bg)
    }

    private func save() async {
        isSaving = true
        let trimmed = content.trimmingCharacters(in: .whitespacesAndNewlines)
        if let editingAtom {
            _ = await store.updateAtom(id: editingAtom.id, content: trimmed)
        } else {
            _ = await store.createAtom(content: trimmed)
        }
        await onSave()
        dismiss()
    }
}
