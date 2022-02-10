using Microsoft.Xrm.Sdk;
using System;

namespace Components.Support
{
    public class LocalPluginContext : ILocalPluginContext
    {
        public IOrganizationService CurrentUserService { get; }

        public IOrganizationService SystemUserService { get; }

        public IPluginExecutionContext PluginExecutionContext { get; }

        public IServiceEndpointNotificationService NotificationService { get; }

        public ITracingService TracingService { get; }

        public LocalPluginContext(IServiceProvider serviceProvider)
        {
            if (serviceProvider == null)
            {
                throw new InvalidPluginExecutionException("serviceProvider"); 
            }

            PluginExecutionContext = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));

            TracingService = new LocalTracingService(serviceProvider);

            NotificationService = (IServiceEndpointNotificationService)serviceProvider.GetService(typeof(IServiceEndpointNotificationService));

            IOrganizationServiceFactory factory = (IOrganizationServiceFactory)serviceProvider.GetService(typeof(IOrganizationServiceFactory));

            CurrentUserService = factory.CreateOrganizationService(PluginExecutionContext.UserId);

            SystemUserService = factory.CreateOrganizationService(null);
        }

        public void Trace(string message)
        {
            if (string.IsNullOrWhiteSpace(message) || TracingService == null)
            {
                return;
            }

            TracingService.Trace(message);
        }
    }
}
