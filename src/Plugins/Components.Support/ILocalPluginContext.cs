using Microsoft.Xrm.Sdk;
using System;

namespace Components.Support
{
    /*
     * This interface provides an abstraction on top of IServiceProvider for commonly used PowerApps CDS Plugin development constructs
     */
    public interface ILocalPluginContext
    {
        // The PowerApps CDS organization service for current user account
        IOrganizationService CurrentUserService { get; }

        // The PowerApps CDS organization service for system user account
        IOrganizationService SystemUserService { get; }

        // IPluginExecutionContext contains information that describes the run-time environment in which the plugin executes, information related to the execution pipeline, and entity business information
        IPluginExecutionContext PluginExecutionContext { get; }

        // Synchronous registered plugins can post the execution context to the Microsoft Azure Service Bus.
        // It is through this notification service that synchronous plug-ins can send brokered messages to the Microsoft Azure Service Bus
        IServiceEndpointNotificationService NotificationService { get; }

        // Provides logging run time trace information for plug-ins.
        ITracingService TracingService { get; }

        // Writes a trace message to the CDS trace log
        void Trace(string message);
    }
}
