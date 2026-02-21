const supabase = require("../config/database");

// GET /api/employees/:id  (guest allowed, privacy enforced)
exports.getEmployeeProfile = async (req, res) => {
  try {
    const employeeId = req.params.id;

    const { data: employee, error } = await supabase
      .from("employees")
      .select("id, user_id, full_name, current_position, bio, skills, profile_visibility, created_at, updated_at")
      .eq("id", employeeId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) throw error;
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    const viewerUserId = req.user?.userId || null;
    const viewerRole = req.user?.role || null;

    const isOwner = viewerUserId && viewerUserId === employee.user_id;
    const isSystemAdmin = viewerRole === "system_admin";

    // Default visibility if null
    const visibility = employee.profile_visibility || "public";

    // If private: only owner (or system admin) can view
    if (visibility === "private" && !isOwner && !isSystemAdmin) {
      // safer (don’t reveal profile exists)
      return res.status(404).json({ message: "Employee not found" });
    }

    return res.status(200).json({ data: employee });
  } catch (err) {
    console.error("getEmployeeProfile error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// PATCH /api/employees/:id  (owner only; system_admin optional)
exports.updateEmployeeProfile = async (req, res) => {
  try {
    const employeeId = req.params.id;

    const viewerUserId = req.user?.userId;
    const viewerRole = req.user?.role;

    if (!viewerUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Fetch to check ownership
    const { data: existing, error: findErr } = await supabase
      .from("employees")
      .select("id, user_id")
      .eq("id", employeeId)
      .is("deleted_at", null)
      .maybeSingle();

    if (findErr) throw findErr;
    if (!existing) return res.status(404).json({ message: "Employee not found" });

    const isOwner = existing.user_id === viewerUserId;
    const isSystemAdmin = viewerRole === "system_admin";

    if (!isOwner && !isSystemAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Allowed fields (map API names -> DB columns)
    const { fullName, currentPosition, bio, skills, profileVisibility } = req.body;

    const update = {};

    if (typeof fullName === "string") update.full_name = fullName.trim();
    if (typeof currentPosition === "string") update.current_position = currentPosition.trim();
    if (typeof bio === "string") update.bio = bio;

    // skills must be array of strings
    if (Array.isArray(skills)) {
      const cleanSkills = skills.filter((s) => typeof s === "string").map((s) => s.trim());
      update.skills = cleanSkills;
    }

    if (typeof profileVisibility === "string") {
      if (!["public", "private"].includes(profileVisibility)) {
        return res.status(400).json({ message: "profileVisibility must be public or private" });
      }
      update.profile_visibility = profileVisibility;
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const { data: updated, error: updErr } = await supabase
      .from("employees")
      .update(update)
      .eq("id", employeeId)
      .select("id, user_id, full_name, current_position, bio, skills, profile_visibility, created_at, updated_at")
      .single();

    if (updErr) throw updErr;

    return res.status(200).json({ data: updated });
  } catch (err) {
    console.error("updateEmployeeProfile error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};