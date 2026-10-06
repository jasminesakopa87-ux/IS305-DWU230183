'use strict';

const ICTSupportRequest = require('./ICTSupportRequest');
const MaintenanceRequest = require('./MaintenanceRequest');
const CleaningRequest = require('./CleaningRequest');
const GeneralServiceRequest = require('./GeneralServiceRequest');

const CLASS_BY_CATEGORY = {
  'ICT Support': ICTSupportRequest,
  'Facilities Maintenance': MaintenanceRequest,
  'Cleaning and Sanitation': CleaningRequest,
  'General Campus Service': GeneralServiceRequest,
};

const CLASS_BY_REQUEST_TYPE = {
  ICTSupportRequest: ICTSupportRequest,
  MaintenanceRequest: MaintenanceRequest,
  CleaningRequest: CleaningRequest,
  GeneralServiceRequest: GeneralServiceRequest,
};

class ServiceRequestFactory {
  /** Used when a Requester submits a brand-new request through the CLI. */
  static createRequest(category, commonData, specialisedData) {
    const RequestClass = CLASS_BY_CATEGORY[category];
    if (!RequestClass) {
      throw new Error(`Validation Error: "${category}" is not a supported category.`);
    }
    return new RequestClass(commonData, specialisedData);
  }

  /** Used when loading previously saved requests back from JSON. */
  static createFromData(savedData, requesterRef) {
    const RequestClass = CLASS_BY_REQUEST_TYPE[savedData.requestType];
    if (!RequestClass) {
      throw new Error(`Validation Error: Cannot restore unknown request type "${savedData.requestType}".`);
    }

    const commonData = {
      requestId: savedData.requestId,
      requester: requesterRef,
      title: savedData.title,
      description: savedData.description,
      location: savedData.location,
      priority: savedData.priority,
    };

    const request = new RequestClass(commonData, savedData);
    request._restoreState(savedData);
    return request;
  }
}

module.exports = ServiceRequestFactory;