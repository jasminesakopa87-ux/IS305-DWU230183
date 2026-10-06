'use strict';

class ReportService {
  constructor(manager) {
    this.manager = manager;
  }

  requestsByStatus() {
    const all = this.manager.getAllRequests();
    return all.reduce((acc, r) => {
      acc[r.getStatus()] = (acc[r.getStatus()] ?? 0) + 1;
      return acc;
    }, {});
  }

  requestsByCategory() {
    const all = this.manager.getAllRequests();
    return all.reduce((acc, r) => {
      acc[r.getCategory()] = (acc[r.getCategory()] ?? 0) + 1;
      return acc;
    }, {});
  }

  requestsByPriority() {
    const all = this.manager.getAllRequests();
    return all.reduce((acc, r) => {
      acc[r.getPriority()] = (acc[r.getPriority()] ?? 0) + 1;
      return acc;
    }, {});
  }

  urgentRequests() {
    return this.manager.getAllRequests().filter((r) => r.getPriority() === 'Urgent');
  }

  overdueRequests() {
    const now = new Date();
    return this.manager.getAllRequests().filter((r) => {
      if (['Resolved', 'Closed', 'Cancelled'].includes(r.getStatus())) return false;
      const deadline = new Date(r.getDateSubmitted().getTime() + r.getTargetResolutionHours() * 3600 * 1000);
      return now > deadline;
    });
  }

  requestsByTechnician() {
    const technicians = this.manager.getUsersByType('Technician');
    return technicians.reduce((acc, tech) => {
      acc[tech.getFullName()] = this.manager.getRequestsByTechnician(tech.getUserId()).length;
      return acc;
    }, {});
  }

  completedRequestsByTechnician() {
    const technicians = this.manager.getUsersByType('Technician');
    return technicians.reduce((acc, tech) => {
      const completed = this.manager
        .getRequestsByTechnician(tech.getUserId())
        .filter((r) => r.getStatus() === 'Closed').length;
      acc[tech.getFullName()] = completed;
      return acc;
    }, {});
  }

  averageResolutionHours() {
    const resolved = this.manager
      .getAllRequests()
      .filter((r) => ['Resolved', 'Closed'].includes(r.getStatus()));
    if (resolved.length === 0) return 0;
    const totalHours = resolved.reduce((sum, r) => {
      return sum + (r.getDateUpdated().getTime() - r.getDateSubmitted().getTime()) / 3600000;
    }, 0);
    return Number((totalHours / resolved.length).toFixed(2));
  }

  requestVolumeByLocation() {
    const all = this.manager.getAllRequests();
    const counts = all.reduce((acc, r) => {
      acc[r.getLocation()] = (acc[r.getLocation()] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count);
  }

  fullReport() {
    return {
      generatedAt: new Date().toISOString(),
      totalRequests: this.manager.getAllRequests().length,
      totalUsers: this.manager.getUsersByType('Student Requester').length +
        this.manager.getUsersByType('Staff Requester').length +
        this.manager.getUsersByType('Service Officer').length +
        this.manager.getUsersByType('Technician').length,
      byStatus: this.requestsByStatus(),
      byCategory: this.requestsByCategory(),
      byPriority: this.requestsByPriority(),
      averageResolutionHours: this.averageResolutionHours(),
      urgentCount: this.urgentRequests().length,
      overdueCount: this.overdueRequests().length,
      requestsByTechnician: this.requestsByTechnician(),
      completedByTechnician: this.completedRequestsByTechnician(),
      volumeByLocation: this.requestVolumeByLocation(),
    };
  }
}

module.exports = ReportService;