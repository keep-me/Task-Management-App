import { useEffect, useState, useRef } from "react";
import BottomNav from "../components/BottomNav";
import HamburgerNav from "../components/HamburgerNav";

interface Template {
  _id: string;
  name: string;
  description?: string;
  category?: string;
  task_title: string;
  task_description?: string;
  priority: string;
  labels?: string[];
  is_public?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface TemplateCategory {
  _id: string;
  name: string;
  description?: string;
  created_at?: string;
}

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("Templates");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [showCreateTaskFromTemplate, setShowCreateTaskFromTemplate] = useState<Template | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      fetchTemplates(storedToken);
      fetchCategories(storedToken);
      const appSettings = localStorage.getItem("appSettings");
      if (appSettings) {
        try {
          const settings = JSON.parse(appSettings);
          if (settings.theme === "dark") {
            document.documentElement.setAttribute("data-theme", "dark");
          }
        } catch (err) {
          console.error("Error applying theme:", err);
        }
      }
    } else {
      window.location.href = "/login";
    }
  }, []);

  const fetchTemplates = async (authToken: string, category?: string) => {
    try {
      setLoading(true);
      let url = "http://localhost:8000/api/templates";
      if (category) {
        url += `?category=${encodeURIComponent(category)}`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      if (Array.isArray(data)) {
        setTemplates(data);
      } else {
        console.error("Expected array but got:", data);
        setTemplates([]);
      }
    } catch (err: any) {
      console.error("Error fetching templates:", err);
      const errorMessage = err.message || "Failed to fetch templates";
      setError(errorMessage);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async (authToken: string) => {
    try {
      const res = await fetch("http://localhost:8000/api/template-categories", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      if (Array.isArray(data)) {
        setCategories(data);
      } else {
        console.error("Expected array but got:", data);
        setCategories([]);
      }
    } catch (err: any) {
      console.error("Error fetching categories:", err);
      const errorMessage = err.message || "Failed to fetch categories";
      setError(errorMessage);
      setCategories([]);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const template = {
      name: formData.get("name") as string,
      description: formData.get("description") as string || null,
      category: formData.get("category") as string || null,
      task_title: formData.get("task_title") as string,
      task_description: formData.get("task_description") as string || null,
      priority: formData.get("priority") as string,
      labels: [],
      is_public: formData.get("is_public") === "on",
    };

    if (!template.name || !template.task_title || !template.priority) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/api/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(template),
      });

      if (res.ok) {
        fetchTemplates(token, selectedCategory);
        form.reset();
        setShowCreateTemplate(false);
        setError("");
        setSuccess("Template created successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const errorData = await res.json();
        const errorMessage = typeof errorData === 'string' ? errorData : 
                           errorData.detail || errorData.message || "Failed to create template";
        setError(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err.message || "Failed to create template";
      setError(errorMessage);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const category = {
      name: formData.get("name") as string,
      description: formData.get("description") as string || null,
    };

    if (!category.name) {
      setError("Please enter a category name");
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/api/template-categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(category),
      });

      if (res.ok) {
        fetchCategories(token);
        form.reset();
        setShowCreateCategory(false);
        setError("");
        setSuccess("Category created successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const errorData = await res.json();
        const errorMessage = typeof errorData === 'string' ? errorData : 
                           errorData.detail || errorData.message || "Failed to create category";
        setError(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err.message || "Failed to create category";
      setError(errorMessage);
    }
  };

  const handleCreateTaskFromTemplate = async (e: React.FormEvent<HTMLFormElement>, template: Template) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const deadlineDate = formData.get("deadline") as string;
    let deadline = deadlineDate;
    
    if (deadlineDate && !deadlineDate.includes("T")) {
      deadline = new Date(deadlineDate).toISOString();
    }

    const taskData = {
      deadline: deadline,
      start_time: formData.get("start_time") as string || null,
      end_time: formData.get("end_time") as string || null,
      assignee: formData.get("assignee") as string || null,
    };

    try {
      const res = await fetch(`http://localhost:8000/api/templates/${template._id}/create-task`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(taskData),
      });

      if (res.ok) {
        form.reset();
        setShowCreateTaskFromTemplate(null);
        setError("");
        setSuccess("Task created from template successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const errorData = await res.json();
        const errorMessage = typeof errorData === 'string' ? errorData : 
                           errorData.detail || errorData.message || "Failed to create task from template";
        setError(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err.message || "Failed to create task from template";
      setError(errorMessage);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:8000/api/templates/${templateId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (res.ok) {
        fetchTemplates(token, selectedCategory);
        setSuccess("Template deleted successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const errorData = await res.json();
        const errorMessage = typeof errorData === 'string' ? errorData : 
                           errorData.detail || errorData.message || "Failed to delete template";
        setError(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err.message || "Failed to delete template";
      setError(errorMessage);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category?")) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:8000/api/template-categories/${categoryId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (res.ok) {
        fetchCategories(token);
        setSuccess("Category deleted successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const errorData = await res.json();
        const errorMessage = typeof errorData === 'string' ? errorData : 
                           errorData.detail || errorData.message || "Failed to delete category";
        setError(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err.message || "Failed to delete category";
      setError(errorMessage);
    }
  };

  const handleExportTemplates = async () => {
    try {
      let url = "http://localhost:8000/api/templates/export";
      if (selectedCategory) {
        url += `?category=${encodeURIComponent(selectedCategory)}`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `templates_${selectedCategory || 'all'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      
      setSuccess("Templates exported successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to export templates";
      setError(errorMessage);
    }
  };

  const handleImportTemplates = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch("http://localhost:8000/api/templates/import", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        fetchTemplates(token, selectedCategory);
        setSuccess("Templates imported successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const errorData = await res.json();
        const errorMessage = typeof errorData === 'string' ? errorData : 
                           errorData.detail || errorData.message || "Failed to import templates";
        setError(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err.message || "Failed to import templates";
      setError(errorMessage);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case "High": return "high";
      case "Medium": return "medium";
      case "Low": return "low";
      default: return "medium";
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header" style={{ fontFamily: "'Playfair Display', serif" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
          <HamburgerNav />
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <h1 style={{ 
              fontSize: "1.5rem", 
              fontWeight: 700, 
              color: "var(--color-primary)", 
              letterSpacing: "2px",
              fontFamily: "'Playfair Display', serif",
              fontStyle: "italic",
              margin: 0
            }}>
              Perspectives
            </h1>
            <p style={{
              fontSize: "0.95rem",
              color: "#20B2AA",
              fontFamily: "'Playfair Display', serif",
              fontStyle: "italic",
              margin: 0,
              fontWeight: 400,
              letterSpacing: "0.5px"
            }}>
              Template Management
            </p>
          </div>
        </div>
        <div className="dashboard-header-actions">
          <button 
            className="header-icon-btn" 
            title="Back to Dashboard"
            onClick={() => window.location.href = '/dashboard'}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #FF5844 0%, #0F9B9D 100%)",
              border: "2px solid #9CA3AF",
              color: "#fff",
              fontSize: "1.25rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s ease"
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="dashboard-main">
          <div className="tabs-container" style={{ justifyContent: "center", gap: "1rem" }}>
            <button 
              className={`tab-button ${activeTab === "Templates" ? "active" : ""}`}
              onClick={() => setActiveTab("Templates")}
              style={{ 
                fontFamily: "'Playfair Display', serif", 
                fontSize: "0.95rem",
                color: "#20B2AA",
                transition: "all 0.3s ease"
              }}
            >
              Templates
            </button>
            <button 
              className={`tab-button ${activeTab === "Categories" ? "active" : ""}`}
              onClick={() => setActiveTab("Categories")}
              style={{ 
                fontFamily: "'Playfair Display', serif", 
                fontSize: "0.95rem",
                color: "#20B2AA",
                transition: "all 0.3s ease"
              }}
            >
              Categories
            </button>
          </div>

          <div className="content-scroll" style={{ paddingBottom: "120px" }}>
            {error && (
              <div style={{
                backgroundColor: "#FEE2E2",
                color: "#DC2626",
                padding: "0.75rem",
                borderRadius: "6px",
                marginBottom: "1rem",
                border: "1px solid #FECACA",
                fontFamily: "'Playfair Display', serif"
              }}>
                {error}
              </div>
            )}
            
            {success && (
              <div style={{
                backgroundColor: "#D1FAE5",
                color: "#065F46",
                padding: "0.75rem",
                borderRadius: "6px",
                marginBottom: "1rem",
                border: "1px solid #A7F3D0",
                fontFamily: "'Playfair Display', serif"
              }}>
                {success}
              </div>
            )}

            {activeTab === "Templates" && (
              <>
                <div style={{ 
                  display: "flex", 
                  gap: "1rem", 
                  marginBottom: "1.5rem", 
                  flexWrap: "wrap", 
                  fontFamily: "'Playfair Display', serif", 
                  alignItems: "center",
                  backgroundColor: "var(--color-bg-light)",
                  padding: "1.5rem",
                  borderRadius: "12px",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
                  border: "1px solid var(--color-border)"
                }}>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      fetchTemplates(token, e.target.value || undefined);
                    }}
                    className="input"
                    style={{ 
                      flex: 1, 
                      minWidth: "150px", 
                      fontFamily: "'Playfair Display', serif",
                      backgroundColor: "white",
                      border: "2px solid var(--color-border)",
                      borderRadius: "8px",
                      padding: "0.875rem",
                      transition: "all 0.3s ease",
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                      cursor: "pointer"
                    }}
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category._id} value={category.name}>{category.name}</option>
                    ))}
                  </select>
                  
                  <button
                    onClick={() => setShowCreateTemplate(true)}
                    className="button button-primary"
                    style={{ 
                      fontFamily: "'Playfair Display', serif",
                      transition: "all 0.3s ease",
                      boxShadow: "0 4px 12px rgba(255, 88, 68, 0.3)"
                    }}
                  >
                    Create Template
                  </button>
                  
                  <button
                    onClick={handleExportTemplates}
                    className="button"
                    style={{ 
                      fontFamily: "'Playfair Display', serif",
                      backgroundColor: "#20B2AA",
                      color: "white",
                      transition: "all 0.3s ease",
                      boxShadow: "0 4px 12px rgba(32, 178, 170, 0.3)"
                    }}
                  >
                    Export
                  </button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImportTemplates}
                    style={{ display: "none" }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="button"
                    style={{ 
                      fontFamily: "'Playfair Display', serif",
                      backgroundColor: "#6366F1",
                      color: "white",
                      transition: "all 0.3s ease",
                      boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)"
                    }}
                  >
                    Import
                  </button>
                </div>

                {showCreateTemplate && (
                  <form 
                    onSubmit={handleCreateTemplate} 
                    className="form" 
                    style={{ 
                      fontFamily: "'Playfair Display', serif",
                      backgroundColor: "var(--color-bg-light)",
                      padding: "1.5rem",
                      borderRadius: "12px",
                      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
                      border: "1px solid var(--color-border)",
                      marginBottom: "1.5rem"
                    }}
                  >
                    <h3 style={{ 
                      marginBottom: "1rem", 
                      color: "var(--color-primary)", 
                      fontSize: "1rem", 
                      fontFamily: "'Playfair Display', serif",
                      textShadow: "0 2px 4px rgba(32, 178, 170, 0.1)"
                    }}>Create New Template</h3>
                    
                    <input 
                      name="name" 
                      placeholder="Template name" 
                      required 
                      className="input" 
                      style={{ 
                        fontFamily: "'Playfair Display', serif",
                        backgroundColor: "white",
                        border: "2px solid var(--color-border)",
                        borderRadius: "8px",
                        padding: "0.875rem",
                        transition: "all 0.3s ease",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                        marginBottom: "1rem"
                      }}
                    />
                    
                    <input 
                      name="description" 
                      placeholder="Template description" 
                      className="input" 
                      style={{ 
                        fontFamily: "'Playfair Display', serif",
                        backgroundColor: "white",
                        border: "2px solid var(--color-border)",
                        borderRadius: "8px",
                        padding: "0.875rem",
                        transition: "all 0.3s ease",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                        marginBottom: "1rem"
                      }}
                    />
                    
                    <select 
                      name="category" 
                      className="input" 
                      style={{ 
                        flex: 1, 
                        fontFamily: "'Playfair Display', serif",
                        backgroundColor: "white",
                        border: "2px solid var(--color-border)",
                        borderRadius: "8px",
                        padding: "0.875rem",
                        transition: "all 0.3s ease",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                        cursor: "pointer",
                        marginBottom: "1rem"
                      }}
                    >
                      <option value="">Select Category</option>
                      {categories.map(category => (
                        <option key={category._id} value={category.name}>{category.name}</option>
                      ))}
                    </select>
                    
                    <h4 style={{ 
                      marginBottom: "0.5rem", 
                      color: "var(--color-text-secondary)", 
                      fontSize: "0.9rem", 
                      fontFamily: "'Playfair Display', serif"
                    }}>Task Details</h4>
                    
                    <input 
                      name="task_title" 
                      placeholder="Task title" 
                      required 
                      className="input" 
                      style={{ 
                        fontFamily: "'Playfair Display', serif",
                        backgroundColor: "white",
                        border: "2px solid var(--color-border)",
                        borderRadius: "8px",
                        padding: "0.875rem",
                        transition: "all 0.3s ease",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                        marginBottom: "1rem"
                      }}
                    />
                    
                    <input 
                      name="task_description" 
                      placeholder="Task description" 
                      className="input" 
                      style={{ 
                        fontFamily: "'Playfair Display', serif",
                        backgroundColor: "white",
                        border: "2px solid var(--color-border)",
                        borderRadius: "8px",
                        padding: "0.875rem",
                        transition: "all 0.3s ease",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                        marginBottom: "1rem"
                      }}
                    />
                    
                    <select 
                      name="priority" 
                      required 
                      className="input" 
                      style={{ 
                        flex: 1, 
                        fontFamily: "'Playfair Display', serif",
                        backgroundColor: "white",
                        border: "2px solid var(--color-border)",
                        borderRadius: "8px",
                        padding: "0.875rem",
                        transition: "all 0.3s ease",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                        cursor: "pointer",
                        marginBottom: "1rem"
                      }}
                    >
                      <option value="">Select Priority</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                    
                    <div style={{ display: "flex", alignItems: "center", marginBottom: "1rem", gap: "0.5rem" }}>
                      <input 
                        type="checkbox" 
                        name="is_public" 
                        id="is_public"
                        style={{ width: "1.25rem", height: "1.25rem" }}
                      />
                      <label htmlFor="is_public" style={{ fontFamily: "'Playfair Display', serif", color: "var(--color-text-secondary)" }}>
                        Make this template public
                      </label>
                    </div>
                    
                    <div style={{ display: "flex", gap: "1rem" }}>
                      <button 
                        type="submit" 
                        className="button button-primary" 
                        style={{ 
                          fontFamily: "'Playfair Display', serif",
                          transition: "all 0.3s ease",
                          boxShadow: "0 4px 12px rgba(255, 88, 68, 0.3)"
                        }}
                      >
                        Create Template
                      </button>
                      <button 
                        type="button"
                        onClick={() => setShowCreateTemplate(false)}
                        className="button"
                        style={{ 
                          fontFamily: "'Playfair Display', serif",
                          backgroundColor: "#6B7280",
                          color: "white",
                          transition: "all 0.3s ease"
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {showCreateTaskFromTemplate && (
                  <form 
                    onSubmit={(e) => handleCreateTaskFromTemplate(e, showCreateTaskFromTemplate)} 
                    className="form" 
                    style={{ 
                      fontFamily: "'Playfair Display', serif",
                      backgroundColor: "var(--color-bg-light)",
                      padding: "1.5rem",
                      borderRadius: "12px",
                      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
                      border: "1px solid var(--color-border)",
                      marginBottom: "1.5rem"
                    }}
                  >
                    <h3 style={{ 
                      marginBottom: "1rem", 
                      color: "var(--color-primary)", 
                      fontSize: "1rem", 
                      fontFamily: "'Playfair Display', serif",
                      textShadow: "0 2px 4px rgba(32, 178, 170, 0.1)"
                    }}>Create Task from Template: {showCreateTaskFromTemplate.name}</h3>
                    
                    <div style={{ marginBottom: "1rem", padding: "1rem", backgroundColor: "#F0FDF4", borderRadius: "8px", border: "1px solid #BBF7D0" }}>
                      <p style={{ fontFamily: "'Playfair Display', serif", margin: "0.25rem 0" }}>
                        <strong>Task Title:</strong> {showCreateTaskFromTemplate.task_title}
                      </p>
                      {showCreateTaskFromTemplate.task_description && (
                        <p style={{ fontFamily: "'Playfair Display', serif", margin: "0.25rem 0" }}>
                          <strong>Description:</strong> {showCreateTaskFromTemplate.task_description}
                        </p>
                      )}
                      <p style={{ fontFamily: "'Playfair Display', serif", margin: "0.25rem 0" }}>
                        <strong>Priority:</strong> {showCreateTaskFromTemplate.priority}
                      </p>
                    </div>
                    
                    <input 
                      name="deadline" 
                      type="date" 
                      required 
                      className="input" 
                      style={{ 
                        fontFamily: "'Playfair Display', serif",
                        backgroundColor: "white",
                        border: "2px solid var(--color-border)",
                        borderRadius: "8px",
                        padding: "0.875rem",
                        transition: "all 0.3s ease",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                        marginBottom: "1rem"
                      }}
                    />
                    
                    <div className="input-group" style={{ marginBottom: "1rem" }}>
                      <input 
                        name="start_time" 
                        type="time" 
                        placeholder="Start Time" 
                        className="input" 
                        style={{ 
                          fontFamily: "'Playfair Display', serif",
                          backgroundColor: "white",
                          border: "2px solid var(--color-border)",
                          borderRadius: "8px",
                          padding: "0.875rem",
                          transition: "all 0.3s ease",
                          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
                        }}
                      />
                      <input 
                        name="end_time" 
                        type="time" 
                        placeholder="End Time" 
                        className="input" 
                        style={{ 
                          fontFamily: "'Playfair Display', serif",
                          backgroundColor: "white",
                          border: "2px solid var(--color-border)",
                          borderRadius: "8px",
                          padding: "0.875rem",
                          transition: "all 0.3s ease",
                          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
                        }}
                      />
                    </div>
                    
                    <input 
                      name="assignee" 
                      placeholder="Assignee (optional)" 
                      className="input" 
                      style={{ 
                        fontFamily: "'Playfair Display', serif",
                        backgroundColor: "white",
                        border: "2px solid var(--color-border)",
                        borderRadius: "8px",
                        padding: "0.875rem",
                        transition: "all 0.3s ease",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                        marginBottom: "1rem"
                      }}
                    />
                    
                    <div style={{ display: "flex", gap: "1rem" }}>
                      <button 
                        type="submit" 
                        className="button button-primary" 
                        style={{ 
                          fontFamily: "'Playfair Display', serif",
                          transition: "all 0.3s ease",
                          boxShadow: "0 4px 12px rgba(255, 88, 68, 0.3)"
                        }}
                      >
                        Create Task
                      </button>
                      <button 
                        type="button"
                        onClick={() => setShowCreateTaskFromTemplate(null)}
                        className="button"
                        style={{ 
                          fontFamily: "'Playfair Display', serif",
                          backgroundColor: "#6B7280",
                          color: "white",
                          transition: "all 0.3s ease"
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                <div className="tasks-list" style={{ marginTop: "0", fontFamily: "'Playfair Display', serif" }}>
                  {loading ? (
                    <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-secondary)", fontFamily: "'Playfair Display', serif" }}>
                      Loading templates...
                    </div>
                  ) : templates.length === 0 ? (
                    <div className="empty-state" style={{ fontFamily: "'Playfair Display', serif" }}>
                      <div className="empty-state-icon" style={{ fontSize: "3rem" }}>📋</div>
                      <div className="empty-state-title">No templates yet</div>
                      <div className="empty-state-description">Create a template using the button above to get started</div>
                    </div>
                  ) : (
                    templates.map((template) => (
                      <div key={template._id} className="task-card" style={{ fontFamily: "'Playfair Display', serif" }}>
                        <div className="task-card-header">
                          <div className="task-card-title">{template.name}</div>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            {template.category && (
                              <span style={{ 
                                fontSize: "0.75rem", 
                                padding: "0.25rem 0.5rem", 
                                borderRadius: "4px", 
                                backgroundColor: "#E0E7FF", 
                                color: "#4338CA" 
                              }}>
                                {template.category}
                              </span>
                            )}
                            <span className={`priority-badge ${getPriorityColor(template.priority)}`}>
                              {template.priority}
                            </span>
                          </div>
                        </div>
                        {template.description && (
                          <p style={{ marginTop: "0.5rem", color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
                            {template.description}
                          </p>
                        )}
                        <div style={{ marginTop: "0.75rem", padding: "0.75rem", backgroundColor: "#F9FAFB", borderRadius: "8px" }}>
                          <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                            <strong>Task:</strong> {template.task_title}
                          </p>
                          {template.task_description && (
                            <p style={{ margin: "0.25rem 0", fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                              {template.task_description}
                            </p>
                          )}
                        </div>
                        <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                          <button
                            onClick={() => setShowCreateTaskFromTemplate(template)}
                            style={{
                              padding: "0.5rem 1rem",
                              backgroundColor: "#20B2AA",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "0.875rem",
                              fontFamily: "'Playfair Display', serif",
                              transition: "all 0.3s ease"
                            }}
                          >
                            Create Task
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template._id)}
                            style={{
                              padding: "0.5rem 1rem",
                              backgroundColor: "#FEE2E2",
                              color: "#DC2626",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "0.875rem",
                              fontFamily: "'Playfair Display', serif",
                              transition: "all 0.3s ease"
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {activeTab === "Categories" && (
              <>
                <div style={{ 
                  display: "flex", 
                  gap: "1rem", 
                  marginBottom: "1.5rem", 
                  flexWrap: "wrap", 
                  fontFamily: "'Playfair Display', serif", 
                  alignItems: "center",
                  backgroundColor: "var(--color-bg-light)",
                  padding: "1.5rem",
                  borderRadius: "12px",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
                  border: "1px solid var(--color-border)"
                }}>
                  <button
                    onClick={() => setShowCreateCategory(true)}
                    className="button button-primary"
                    style={{ 
                      fontFamily: "'Playfair Display', serif",
                      transition: "all 0.3s ease",
                      boxShadow: "0 4px 12px rgba(255, 88, 68, 0.3)"
                    }}
                  >
                    Create Category
                  </button>
                </div>

                {showCreateCategory && (
                  <form 
                    onSubmit={handleCreateCategory} 
                    className="form" 
                    style={{ 
                      fontFamily: "'Playfair Display', serif",
                      backgroundColor: "var(--color-bg-light)",
                      padding: "1.5rem",
                      borderRadius: "12px",
                      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
                      border: "1px solid var(--color-border)",
                      marginBottom: "1.5rem"
                    }}
                  >
                    <h3 style={{ 
                      marginBottom: "1rem", 
                      color: "var(--color-primary)", 
                      fontSize: "1rem", 
                      fontFamily: "'Playfair Display', serif",
                      textShadow: "0 2px 4px rgba(32, 178, 170, 0.1)"
                    }}>Create New Category</h3>
                    
                    <input 
                      name="name" 
                      placeholder="Category name" 
                      required 
                      className="input" 
                      style={{ 
                        fontFamily: "'Playfair Display', serif",
                        backgroundColor: "white",
                        border: "2px solid var(--color-border)",
                        borderRadius: "8px",
                        padding: "0.875rem",
                        transition: "all 0.3s ease",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                        marginBottom: "1rem"
                      }}
                    />
                    
                    <input 
                      name="description" 
                      placeholder="Category description" 
                      className="input" 
                      style={{ 
                        fontFamily: "'Playfair Display', serif",
                        backgroundColor: "white",
                        border: "2px solid var(--color-border)",
                        borderRadius: "8px",
                        padding: "0.875rem",
                        transition: "all 0.3s ease",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                        marginBottom: "1rem"
                      }}
                    />
                    
                    <div style={{ display: "flex", gap: "1rem" }}>
                      <button 
                        type="submit" 
                        className="button button-primary" 
                        style={{ 
                          fontFamily: "'Playfair Display', serif",
                          transition: "all 0.3s ease",
                          boxShadow: "0 4px 12px rgba(255, 88, 68, 0.3)"
                        }}
                      >
                        Create Category
                      </button>
                      <button 
                        type="button"
                        onClick={() => setShowCreateCategory(false)}
                        className="button"
                        style={{ 
                          fontFamily: "'Playfair Display', serif",
                          backgroundColor: "#6B7280",
                          color: "white",
                          transition: "all 0.3s ease"
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                <div className="tasks-list" style={{ marginTop: "0", fontFamily: "'Playfair Display', serif" }}>
                  {categories.length === 0 ? (
                    <div className="empty-state" style={{ fontFamily: "'Playfair Display', serif" }}>
                      <div className="empty-state-icon" style={{ fontSize: "3rem" }}>🏷️</div>
                      <div className="empty-state-title">No categories yet</div>
                      <div className="empty-state-description">Create a category to organize your templates</div>
                    </div>
                  ) : (
                    categories.map((category) => (
                      <div key={category._id} className="task-card" style={{ fontFamily: "'Playfair Display', serif" }}>
                        <div className="task-card-header">
                          <div className="task-card-title">{category.name}</div>
                        </div>
                        {category.description && (
                          <p style={{ marginTop: "0.5rem", color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
                            {category.description}
                          </p>
                        )}
                        <div style={{ marginTop: "1rem" }}>
                          <button
                            onClick={() => handleDeleteCategory(category._id)}
                            style={{
                              padding: "0.5rem 1rem",
                              backgroundColor: "#FEE2E2",
                              color: "#DC2626",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "0.875rem",
                              fontFamily: "'Playfair Display', serif",
                              transition: "all 0.3s ease"
                            }}
                          >
                            Delete Category
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
