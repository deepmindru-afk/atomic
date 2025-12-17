//! Database access for the standalone MCP server

use rusqlite::ffi::sqlite3_auto_extension;
use rusqlite::Connection;
use sqlite_vec::sqlite3_vec_init;
use std::path::Path;
use std::sync::{Arc, Mutex};

/// Shared database wrapper
pub struct Database {
    #[allow(dead_code)]
    conn: Mutex<Connection>,
    db_path: String,
}

impl Database {
    /// Open the database at the given path
    pub fn new(path: &Path) -> Result<Arc<Self>, String> {
        // Register sqlite-vec extension (once, before opening any connection)
        unsafe {
            #[allow(clippy::missing_transmute_annotations)]
            sqlite3_auto_extension(Some(std::mem::transmute(sqlite3_vec_init as *const ())));
        }

        let conn = Connection::open(path).map_err(|e| format!("Failed to open database: {}", e))?;

        let db_path = path.to_string_lossy().to_string();

        Ok(Arc::new(Self {
            conn: Mutex::new(conn),
            db_path,
        }))
    }

    /// Create a new connection to the same database
    pub fn new_connection(&self) -> Result<Connection, String> {
        Connection::open(&self.db_path).map_err(|e| format!("Failed to open connection: {}", e))
    }
}
